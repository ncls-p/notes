import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth/serverAuth';

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
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    // If folderId is provided, verify the folder exists and belongs to the user
    if (validatedData.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: validatedData.folderId,
          ownerId: authResult.userId,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate note titles in the same folder
    const existingNote = await prisma.note.findFirst({
      where: {
        title: validatedData.title,
        folderId: validatedData.folderId,
        ownerId: authResult.userId,
      },
    });

    if (existingNote) {
      return NextResponse.json(
        { error: 'A note with this title already exists in this location' },
        { status: 409 }
      );
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');

    // Validate folderId if provided
    const queryData = listNotesSchema.parse({
      folderId: folderId === 'null' ? null : folderId,
    });

    // If folderId is provided and not null, verify the folder exists and belongs to the user
    if (queryData.folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: queryData.folderId,
          ownerId: authResult.userId,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found or access denied' },
          { status: 404 }
        );
      }
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}