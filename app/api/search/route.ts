import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth/serverAuth';
import { apiLogger, logError, logDatabaseOperation, logPerformance } from '@/lib/logger';

const prisma = new PrismaClient();

// Schema for search query
const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(255, 'Search query too long'),
  sortBy: z.enum(['relevance', 'name', 'createdAt', 'updatedAt']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().min(1).max(100).optional().default(50),
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const userId = request.headers.get('x-user-id');

  const logger = apiLogger.child({
    requestId,
    operation: 'search',
    userId,
  });

  logger.info('Search started');

  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      logger.warn({ reason: 'auth_failed' }, 'Search failed: unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const limit = searchParams.get('limit');

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
        'Search validation failed'
      );
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedQuery.error.errors },
        { status: 400 }
      );
    }

    const {
      query: searchQuery,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
      limit: validLimit,
    } = validatedQuery.data;

    logger.debug(
      {
        query: searchQuery.substring(0, 50) + (searchQuery.length > 50 ? '...' : ''),
        sortBy: validSortBy,
        sortOrder: validSortOrder,
        limit: validLimit,
      },
      'Search parameters validated'
    );

    const searchTerm = `%${searchQuery.toLowerCase()}%`;

    // Search folders
    const foldersSearchStartTime = Date.now();
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: authResult.userId,
        name: {
          contains: searchQuery,
          mode: 'insensitive',
        },
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
    logDatabaseOperation('findMany', 'folder', Date.now() - foldersSearchStartTime, {
      searchQuery: searchQuery.substring(0, 20) + '...',
      count: folders.length,
    });

    // Search notes
    const notesSearchStartTime = Date.now();
    const notes = await prisma.note.findMany({
      where: {
        ownerId: authResult.userId,
        OR: [
          {
            title: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            contentMarkdown: {
              contains: searchQuery,
              mode: 'insensitive',
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
    logDatabaseOperation('findMany', 'note', Date.now() - notesSearchStartTime, {
      searchQuery: searchQuery.substring(0, 20) + '...',
      count: notes.length,
    });

    // Build folder paths for each result
    const buildFolderPath = async (folderId: string | null): Promise<string> => {
      if (!folderId) return 'Root';

      const path: string[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const folder: { name: string; parentId: string | null } | null =
          await prisma.folder.findUnique({
            where: { id: currentId },
            select: { name: true, parentId: true },
          });

        if (!folder) break;
        path.unshift(folder.name);
        currentId = folder.parentId;
      }

      return path.length > 0 ? path.join(' / ') : 'Root';
    };

    // Add folder paths to results
    const foldersWithPaths = await Promise.all(
      folders.map(async (folder) => ({
        ...folder,
        path: await buildFolderPath(folder.parentId),
        type: 'folder' as const,
      }))
    );

    const notesWithPaths = await Promise.all(
      notes.map(async (note) => ({
        ...note,
        path: await buildFolderPath(note.folderId),
        type: 'note' as const,
      }))
    );

    // Combine and sort results
    let allResults = [...foldersWithPaths, ...notesWithPaths];

    // Sort results based on sortBy parameter
    if (validSortBy === 'name') {
      allResults.sort((a, b) => {
        const nameA = a.type === 'folder' ? a.name : a.title;
        const nameB = b.type === 'folder' ? b.name : b.title;
        return validSortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (validSortBy === 'createdAt') {
      allResults.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return validSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (validSortBy === 'updatedAt') {
      allResults.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return validSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }
    // For 'relevance', we keep the default order from the database

    // Limit final results
    allResults = allResults.slice(0, validLimit);

    logger.info(
      {
        query: searchQuery.substring(0, 50) + (searchQuery.length > 50 ? '...' : ''),
        foldersFound: folders.length,
        notesFound: notes.length,
        totalResults: allResults.length,
        sortBy: validSortBy,
        sortOrder: validSortOrder,
        totalDuration: Date.now() - startTime,
      },
      'Search completed successfully'
    );

    logPerformance(logger, 'search', startTime, {
      query: searchQuery.substring(0, 20) + '...',
      totalResults: allResults.length,
      foldersFound: folders.length,
      notesFound: notes.length,
    });

    return NextResponse.json({
      results: allResults.map((result) => ({
        id: result.id,
        type: result.type,
        name: result.type === 'folder' ? result.name : result.title,
        title: result.type === 'note' ? result.title : undefined,
        contentMarkdown: result.type === 'note' ? result.contentMarkdown : undefined,
        path: result.path,
        folderId: result.type === 'note' ? result.folderId : result.parentId,
        folder: result.type === 'note' ? result.folder : result.parent,
        childrenCount: result.type === 'folder' ? result._count?.children : undefined,
        notesCount: result.type === 'folder' ? result._count?.notes : undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      })),
      query: searchQuery,
      totalResults: allResults.length,
    });
  } catch (error) {
    logError(logger, error, {
      requestId,
      operation: 'search',
      userId: userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
