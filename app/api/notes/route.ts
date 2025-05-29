import { verifyJWT } from "@/lib/auth/serverAuth";
import {
  apiLogger,
  logBusinessEvent,
  logDatabaseOperation,
  logError,
  logPerformance,
} from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";

// Schema for creating a note
const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Note title is required")
    .max(255, "Note title too long"),
  contentMarkdown: z.string().optional().default(""),
  folderId: z.string().uuid().optional().nullable(),
});

// Schema for listing notes
const listNotesSchema = z.object({
  folderId: z.string().uuid().optional().nullable(),
  sortBy: z
    .enum(["title", "createdAt", "updatedAt"])
    .optional()
    .default("title"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || "unknown";
  const userId = request.headers.get("x-user-id");

  const logger = apiLogger.child({
    requestId,
    operation: "create_note",
    userId,
  });

  logger.info("Note creation started");

  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      logger.warn(
        { reason: "auth_failed" },
        "Note creation failed: unauthorized",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    let validatedData: z.infer<typeof createNoteSchema>;
    try {
      validatedData = createNoteSchema.parse(body);
    } catch (validationError) {
      logger.warn(
        {
          validationErrors:
            validationError instanceof z.ZodError
              ? validationError.errors
              : "unknown",
          title: body.title ? body.title.substring(0, 20) + "..." : "missing",
        },
        "Note creation validation failed",
      );

      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input", details: validationError.errors },
          { status: 400 },
        );
      }
      throw validationError;
    }

    logger.debug(
      {
        title:
          validatedData.title.substring(0, 50) +
          (validatedData.title.length > 50 ? "..." : ""),
        folderId: validatedData.folderId,
        contentLength: validatedData.contentMarkdown?.length || 0,
      },
      "Note data validated",
    );

    // If folderId is provided, verify the folder exists and belongs to the user
    if (validatedData.folderId) {
      const folderStartTime = Date.now();
      const folder = await prisma.folder.findFirst({
        where: {
          id: validatedData.folderId,
          ownerId: authResult.userId,
        },
      });
      logDatabaseOperation(
        "findFirst",
        "folder",
        Date.now() - folderStartTime,
        {
          folderId: validatedData.folderId,
          userId: authResult.userId,
        },
      );

      if (!folder) {
        logger.warn(
          {
            folderId: validatedData.folderId,
            userId: authResult.userId,
          },
          "Note creation failed: folder not found or access denied",
        );

        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 404 },
        );
      }

      logger.info("Folder found:", folder);

      // Check if a note with the same title already exists in the folder
      const duplicateCheckStartTime = Date.now();
      const existingNote = await prisma.note.findFirst({
        where: {
          title: validatedData.title,
          folderId: validatedData.folderId,
          ownerId: authResult.userId,
        },
      });
      logDatabaseOperation(
        "findFirst",
        "note",
        Date.now() - duplicateCheckStartTime,
        {
          operation: "duplicate_check",
          title: validatedData.title.substring(0, 20) + "...",
          folderId: validatedData.folderId,
        },
      );

      if (existingNote) {
        logger.warn(
          {
            title: validatedData.title.substring(0, 50) + "...",
            folderId: validatedData.folderId,
            existingNoteId: existingNote.id,
          },
          "Note creation failed: duplicate title in folder",
        );

        return NextResponse.json(
          { error: "A note with this title already exists in this location" },
          { status: 409 },
        );
      }
    }

    // Create the note
    const createStartTime = Date.now();
    const note = await prisma.note.create({
      data: {
        title: validatedData.title,
        contentMarkdown: validatedData.contentMarkdown,
        folderId: validatedData.folderId,
        ownerId: authResult.userId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    logDatabaseOperation("create", "note", Date.now() - createStartTime, {
      noteId: note.id,
      title: note.title.substring(0, 20) + "...",
      folderId: note.folderId,
    });

    logger.info(
      {
        noteId: note.id,
        title:
          note.title.substring(0, 50) + (note.title.length > 50 ? "..." : ""),
        folderId: note.folderId,
        contentLength: note.contentMarkdown?.length || 0,
        totalDuration: Date.now() - startTime,
      },
      "Note created successfully",
    );

    logBusinessEvent("note_created", authResult.userId, {
      requestId,
      noteId: note.id,
      title: note.title.substring(0, 50) + "...",
      folderId: note.folderId,
    });

    logPerformance(logger, "create_note", startTime, {
      noteId: note.id,
      contentLength: note.contentMarkdown?.length || 0,
    });

    return NextResponse.json({
      id: note.id,
      title: note.title,
      contentMarkdown: note.contentMarkdown,
      folderId: note.folderId,
      folder: note.folder,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    });
  } catch (error) {
    logError(logger, error, {
      requestId,
      operation: "create_note",
      userId: userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || "unknown";
  const userId = request.headers.get("x-user-id");

  const logger = apiLogger.child({
    requestId,
    operation: "list_notes",
    userId,
  });

  logger.info("Note listing started");

  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      logger.warn(
        { reason: "auth_failed" },
        "Note listing failed: unauthorized",
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    logger.info("[API/Notes] Received query params:", {
      folderId,
      sortBy,
      sortOrder,
    });

    // Validate query parameters
    const validatedQuery = listNotesSchema.safeParse({
      folderId: folderId === "null" ? null : folderId,
      sortBy: sortBy,
      sortOrder: sortOrder,
    });

    if (!validatedQuery.success) {
      logger.warn(
        {
          validationErrors: validatedQuery.error.errors,
          queryParams: { folderId, sortBy, sortOrder },
        },
        "Note listing validation failed",
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
      folderId: validFolderId,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    } = validatedQuery.data;

    logger.debug(
      {
        folderId: validFolderId,
        sortBy: validSortBy,
        sortOrder: validSortOrder,
      },
      "Note listing parameters validated",
    );

    // If folderId is provided and not null, verify the folder exists and belongs to the user
    if (validFolderId) {
      const folderCheckStartTime = Date.now();
      const folder = await prisma.folder.findFirst({
        where: {
          id: validFolderId,
          ownerId: authResult.userId,
        },
      });
      logDatabaseOperation(
        "findFirst",
        "folder",
        Date.now() - folderCheckStartTime,
        {
          folderId: validFolderId,
          userId: authResult.userId,
        },
      );

      if (!folder) {
        logger.warn(
          {
            folderId: validFolderId,
            userId: authResult.userId,
          },
          "Note listing failed: folder not found or access denied",
        );
        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 404 },
        );
      }
    }

    const orderByClause: { [key: string]: "asc" | "desc" } = {};
    if (validSortBy) {
      orderByClause[validSortBy] = validSortOrder;
    } else {
      orderByClause["title"] = "asc"; // Default sort
    }
    logger.info("[API/Notes] Constructed orderBy clause:", orderByClause);

    const notesFetchStartTime = Date.now();
    const notes = await prisma.note.findMany({
      where: {
        ownerId: authResult.userId,
        folderId: validFolderId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: orderByClause,
    });
    logDatabaseOperation("findMany", "note", Date.now() - notesFetchStartTime, {
      count: notes.length,
      folderId: validFolderId,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    });

    logger.info(
      {
        count: notes.length,
        folderId: validFolderId,
        sortBy: validSortBy,
        sortOrder: validSortOrder,
        totalDuration: Date.now() - startTime,
      },
      "Notes listed successfully",
    );

    logPerformance(logger, "list_notes", startTime, {
      count: notes.length,
      folderId: validFolderId,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    });

    return NextResponse.json(
      notes.map((note) => ({
        id: note.id,
        title: note.title,
        contentMarkdown: note.contentMarkdown,
        folderId: note.folderId,
        folder: note.folder,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    );
  } catch (error) {
    logError(logger, error, {
      requestId,
      operation: "list_notes",
      userId: userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
