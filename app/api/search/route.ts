import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { verifyJWT } from "@/lib/auth/serverAuth";
import {
  apiLogger,
  logError,
  logDatabaseOperation,
  logPerformance,
} from "@/lib/logger";
import prisma from "@/lib/db";
import { buildFolderPath as buildFolderPathUtil } from "@/lib/utils/buildFolderPath";

// Schema for search query
const searchSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .max(255, "Search query too long"),
  sortBy: z
    .enum(["relevance", "name", "createdAt", "updatedAt"])
    .optional()
    .default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.number().min(1).max(100).optional().default(50),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || "unknown";
  const userId = request.headers.get("x-user-id");

  const logger = apiLogger.child({
    requestId,
    operation: "search",
    userId,
  });

  logger.info("Search started");

  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      logger.warn({ reason: "auth_failed" }, "Search failed: unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Add detailed request logging
    logger.debug(
      {
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
      },
      "Request details",
    );

    const urlSearchParams = new URL(request.url).searchParams;
    const query = urlSearchParams.get("query");
    const sortBy = urlSearchParams.get("sortBy") || undefined;
    const sortOrder = urlSearchParams.get("sortOrder") || undefined;
    const limit = urlSearchParams.get("limit") || undefined;

    // Validate query parameters
    const validatedQuery = searchSchema.safeParse({
      query,
      sortBy,
      sortOrder,
      limit: limit ? parseInt(limit) : undefined,
    });

    if (!validatedQuery.success) {
      logger.warn(
        {
          validationErrors: validatedQuery.error.errors,
          queryParams: { query, sortBy, sortOrder, limit },
        },
        "Search validation failed",
      );
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validatedQuery.error.errors,
        },
        { status: 400 },
      );
    }

    const {
      query: searchQuery,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
      limit: validLimit,
    } = validatedQuery.data;

    // Ensure searchQuery is defined before substring operations
    const truncatedQuery = searchQuery
      ? searchQuery.substring(0, 50) + (searchQuery.length > 50 ? "..." : "")
      : "";

    logger.debug(
      {
        query: truncatedQuery,
        sortBy: validSortBy,
        sortOrder: validSortOrder,
        limit: validLimit,
      },
      "Search parameters validated",
    );

    const _searchTerm = `%${searchQuery.toLowerCase()}%`;

    // Search folders
    const foldersSearchStartTime = Date.now();
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: authResult.userId,
        ...(searchQuery
          ? {
              name: {
                contains: searchQuery,
                mode: "insensitive",
              },
            }
          : {}),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            notes: true,
          },
        },
      },
      take: validLimit,
    });
    // Safely log folder search operation
    const folderSearchQuery = searchQuery
      ? searchQuery.substring(0, 20) + (searchQuery.length > 20 ? "..." : "")
      : "";
    logDatabaseOperation(
      "findMany",
      "folder",
      Date.now() - foldersSearchStartTime,
      {
        searchQuery: folderSearchQuery,
        count: folders?.length || 0,
      },
    );

    // Search notes
    const notesSearchStartTime = Date.now();
    const notes = await prisma.note.findMany({
      where: {
        ownerId: authResult.userId,
        OR: [
          {
            title: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
          {
            contentMarkdown: {
              contains: searchQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: validLimit,
    });
    // Safely log note search operation
    const noteSearchQuery = searchQuery
      ? searchQuery.substring(0, 20) + (searchQuery.length > 20 ? "..." : "")
      : "";
    logDatabaseOperation(
      "findMany",
      "note",
      Date.now() - notesSearchStartTime,
      {
        searchQuery: noteSearchQuery,
        count: notes?.length || 0,
      },
    );

    // Prefetch all folder IDs needed for path building
    const allFolderIds = new Set<string>();
    (folders || []).forEach((folder) => {
      if (folder.parentId) allFolderIds.add(folder.parentId);
    });
    (notes || []).forEach((note) => {
      if (note.folderId) allFolderIds.add(note.folderId);
    });

    logger.debug(`Prefetching ${allFolderIds.size} parent folders`);

    // If no folder IDs to fetch, skip database query
    if (allFolderIds.size === 0) {
      logger.debug("No parent folders to fetch");
    }

    // Fetch all parent folders in a single query
    const parentFolders =
      allFolderIds.size > 0
        ? await prisma.folder.findMany({
            where: { id: { in: Array.from(allFolderIds) } },
            select: { id: true, name: true, parentId: true },
          })
        : [];

    logger.debug(`Fetched ${parentFolders.length} parent folders`);

    // Build folder map for path resolution with all ancestors
    const folderMap = new Map<
      string,
      { name: string; parentId: string | null }
    >();
    const allAncestors = new Set(parentFolders);
    const queue = [...parentFolders];

    while (queue.length > 0) {
      const folder = queue.shift()!;
      if (folder.parentId && !folderMap.has(folder.parentId)) {
        const parent = await prisma.folder.findUnique({
          where: { id: folder.parentId },
          select: { id: true, name: true, parentId: true },
        });
        if (parent) {
          folderMap.set(parent.id, parent);
          allAncestors.add(parent);
          queue.push(parent);
        }
      }
    }

    // Add all ancestors to the folder map
    allAncestors.forEach((folder) => folderMap.set(folder.id, folder));
    logger.debug(`Built folder map with ${folderMap.size} entries`);

    /**
     * Builds the full folder path for a given folder ID using the comprehensive folder map.
     * Handles null parent references and prevents infinite loops from cyclic references.
     *
     * @param {string | null} folderId - The ID of the folder to build the path for
     * @returns {string} The full folder path as a string
     */
    // Use the utility function for building folder paths
    const buildFolderPath = (folderId: string | null): string => {
      return buildFolderPathUtil(folderMap, folderId);
    };

    // Add folder paths to results
    const foldersWithPaths = (folders || []).map((folder) => ({
      ...folder,
      path: buildFolderPath(folder.parentId),
      type: "folder" as const,
    }));

    const notesWithPaths = (notes || []).map((note) => ({
      ...note,
      path: buildFolderPath(note.folderId),
      type: "note" as const,
    }));

    // Combine and sort results
    let allResults = [...foldersWithPaths, ...notesWithPaths];

    // Sort results based on sortBy parameter
    if (validSortBy === "name") {
      allResults.sort((a, b) => {
        const nameA = a.type === "folder" ? a.name : a.title;
        const nameB = b.type === "folder" ? b.name : b.title;
        return validSortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    } else if (validSortBy === "createdAt") {
      allResults.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return validSortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    } else if (validSortBy === "updatedAt") {
      allResults.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return validSortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    }
    // For 'relevance', we keep the default order from the database

    // Limit final results
    allResults = allResults.slice(0, validLimit);

    logger.info(
      {
        query:
          searchQuery.substring(0, 50) + (searchQuery.length > 50 ? "..." : ""),
        foldersFound: folders.length,
        notesFound: notes.length,
        totalResults: allResults.length,
        sortBy: validSortBy,
        sortOrder: validSortOrder,
        totalDuration: Date.now() - startTime,
      },
      "Search completed successfully",
    );

    logPerformance(logger, "search", startTime, {
      query: searchQuery.substring(0, 20) + "...",
      totalResults: allResults.length,
      foldersFound: folders.length,
      notesFound: notes.length,
    });

    return NextResponse.json({
      results: allResults.map((result) => ({
        id: result.id,
        type: result.type,
        name: result.type === "folder" ? result.name : result.title,
        title: result.type === "note" ? result.title : undefined,
        contentMarkdown:
          result.type === "note" ? result.contentMarkdown : undefined,
        path: result.path,
        folderId: result.type === "note" ? result.folderId : result.parentId,
        folder: result.type === "note" ? result.folder : result.parent,
        childrenCount:
          result.type === "folder" ? result._count?.children : undefined,
        notesCount: result.type === "folder" ? result._count?.notes : undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      })),
      query: searchQuery,
      totalResults: allResults.length,
    });
  } catch (error: any) {
    logError(logger, error, {
      requestId,
      operation: "search",
      userId: userId,
      duration: Date.now() - startTime,
    });

    // Enhanced error details
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    };

    logger.error(errorDetails, "Internal server error during search");
    return NextResponse.json(
      { error: "Internal server error", details: errorDetails },
      { status: 500 },
    );
  }
}
