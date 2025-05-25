import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth/serverAuth';
import { apiLogger, logError, logDatabaseOperation, logPerformance, logBusinessEvent } from '@/lib/logger';

const prisma = new PrismaClient();

// Schema for creating a note
const createNoteSchema = z.object({
  title: z.string().min(1, 'Note title is required').max(255, 'Note title too long'),
  contentMarkdown: z.string().optional().default(''),
  folderId: z.string().uuid().optional().nullable(),
});

// Schema for listing notes
const listNotesSchema = z.object({
  folderId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const userId = request.headers.get('x-user-id');

  const logger = apiLogger.child({
    requestId,
    operation: 'create_note',
    userId
  });

  logger.info('Note creation started');

  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      logger.warn({ reason: 'auth_failed' }, 'Note creation failed: unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    try {
      var validatedData = createNoteSchema.parse(body);
    } catch (validationError) {
      logger.warn({
        validationErrors: validationError instanceof z.ZodError ? validationError.errors : 'unknown',
        title: body.title ? body.title.substring(0, 20) + '...' : 'missing'
      }, 'Note creation validation failed');

      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    logger.debug({
      title: validatedData.title.substring(0, 50) + (validatedData.title.length > 50 ? '...' : ''),
      folderId: validatedData.folderId,
      contentLength: validatedData.contentMarkdown?.length || 0
    }, 'Note data validated');

    // If folderId is provided, verify the folder exists and belongs to the user
    if (validatedData.folderId) {
      const folderStartTime = Date.now();
      const folder = await prisma.folder.findFirst({
        where: {
          id: validatedData.folderId,
          ownerId: authResult.userId,
        },
      });
      logDatabaseOperation('findFirst', 'folder', Date.now() - folderStartTime, {
        folderId: validatedData.folderId,
        userId: authResult.userId
      });

      if (!folder) {
        logger.warn({
          folderId: validatedData.folderId,
          userId: authResult.userId
        }, 'Note creation failed: folder not found or access denied');

        return NextResponse.json(
          { error: 'Folder not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate note titles in the same folder
    const duplicateCheckStartTime = Date.now();
    const existingNote = await prisma.note.findFirst({
      where: {
        title: validatedData.title,
        folderId: validatedData.folderId,
        ownerId: authResult.userId,
      },
    });
    logDatabaseOperation('findFirst', 'note', Date.now() - duplicateCheckStartTime, {
      operation: 'duplicate_check',
      title: validatedData.title.substring(0, 20) + '...',
      folderId: validatedData.folderId
    });

    if (existingNote) {
      logger.warn({
        title: validatedData.title.substring(0, 50) + '...',
        folderId: validatedData.folderId,
        existingNoteId: existingNote.id
      }, 'Note creation failed: duplicate title in folder');

      return NextResponse.json(
        { error: 'A note with this title already exists in this location' },
        { status: 409 }
      );
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
    logDatabaseOperation('create', 'note', Date.now() - createStartTime, {
      noteId: note.id,
      title: note.title.substring(0, 20) + '...',
      folderId: note.folderId
    });

    logger.info({
      noteId: note.id,
      title: note.title.substring(0, 50) + (note.title.length > 50 ? '...' : ''),
      folderId: note.folderId,
      contentLength: note.contentMarkdown?.length || 0,
      totalDuration: Date.now() - startTime,
    }, 'Note created successfully');

    logBusinessEvent('note_created', authResult.userId, {
      requestId,
      noteId: note.id,
      title: note.title.substring(0, 50) + '...',
      folderId: note.folderId,
    });

    logPerformance(logger, 'create_note', startTime, {
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
      operation: 'create_note',
      userId: userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const userId = request.headers.get('x-user-id');

  const logger = apiLogger.child({
    requestId,
    operation: 'list_notes',
    userId
  });

  try {
    console.log('[DEBUG] About to log: Notes listing started');
    logger.info('Notes listing started');
    console.log('[DEBUG] Successfully logged: Notes listing started');
  } catch (error) {
    console.log('[DEBUG] Error logging Notes listing started:', error);
  }

  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      logger.warn({ reason: 'auth_failed' }, 'Notes listing failed: unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    // Validate folderId if provided
    let queryData;
    try {
      queryData = listNotesSchema.parse({
        folderId: folderId === 'null' ? null : folderId,
      });
    } catch (validationError) {
      logger.warn({
        folderId,
        validationErrors: validationError instanceof z.ZodError ? validationError.errors : 'unknown'
      }, 'Notes listing validation failed');

      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    logger.debug({ folderId: queryData.folderId }, 'Query parameters validated');

    // If folderId is provided and not null, verify the folder exists and belongs to the user
    if (queryData.folderId) {
      const folderStartTime = Date.now();
      const folder = await prisma.folder.findFirst({
        where: {
          id: queryData.folderId,
          ownerId: authResult.userId,
        },
      });
      logDatabaseOperation('findFirst', 'folder', Date.now() - folderStartTime, {
        folderId: queryData.folderId,
        userId: authResult.userId
      });

      if (!folder) {
        logger.warn({
          folderId: queryData.folderId,
          userId: authResult.userId
        }, 'Notes listing failed: folder not found or access denied');

        return NextResponse.json(
          { error: 'Folder not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Fetch notes
    const fetchStartTime = Date.now();
    const notes = await prisma.note.findMany({
      where: {
        ownerId: authResult.userId,
        folderId: queryData.folderId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    logDatabaseOperation('findMany', 'note', Date.now() - fetchStartTime, {
      folderId: queryData.folderId,
      userId: authResult.userId,
      resultCount: notes.length
    });

    try {
      console.log('[DEBUG] About to log: Notes listed successfully');
      logger.info({
        folderId: queryData.folderId,
        notesCount: notes.length,
        totalDuration: Date.now() - startTime,
      }, 'Notes listed successfully');
      console.log('[DEBUG] Successfully logged: Notes listed successfully');
    } catch (error) {
      console.log('[DEBUG] Error logging Notes listed successfully:', error);
    }

    logPerformance(logger, 'list_notes', startTime, {
      notesCount: notes.length,
      folderId: queryData.folderId,
    });

    return NextResponse.json(
      notes.map(note => ({
        id: note.id,
        title: note.title,
        contentMarkdown: note.contentMarkdown,
        folderId: note.folderId,
        folder: note.folder,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }))
    );
  } catch (error) {
    logError(logger, error, {
      requestId,
      operation: 'list_notes',
      userId: userId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}