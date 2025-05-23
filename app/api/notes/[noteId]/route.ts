import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content_markdown: z.string().optional(),
  folder_id: z.string().optional(),
});

type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export async function GET(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    // Get user from auth token (middleware will verify JWT)
    const user = request.headers.get('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = JSON.parse(user).id;

    // Fetch note
    const note = await prisma.note.findFirst({
      where: {
        id: params.noteId,
        OR: [
          { owner_id: userId },
          { is_public: true },
          {
            permissions: {
              some: {
                user_id: userId,
              },
            },
          },
        ],
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    // Get user from auth token (middleware will verify JWT)
    const user = request.headers.get('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = JSON.parse(user).id;

    // Validate input
    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // Check if user has permission to edit
    const note = await prisma.note.findFirst({
      where: {
        id: params.noteId,
        OR: [
          { owner_id: userId },
          {
            permissions: {
              some: {
                user_id: userId,
                access_level: 'edit',
              },
            },
          },
        ],
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found or permission denied' }, { status: 404 });
    }

    // Update note
    const updatedNote = await prisma.note.update({
      where: { id: params.noteId },
      data: validatedData,
    });

    return NextResponse.json(updatedNote);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    // Get user from auth token (middleware will verify JWT)
    const user = request.headers.get('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = JSON.parse(user).id;

    // Check if user owns the note
    const note = await prisma.note.findFirst({
      where: {
        id: params.noteId,
        owner_id: userId,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found or permission denied' }, { status: 404 });
    }

    // Delete note
    await prisma.note.delete({
      where: { id: params.noteId },
    });

    return NextResponse.json({ message: 'Note deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
