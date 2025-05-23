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

export async function GET(request: NextRequest, context: { params: Promise<{ noteId: string }> }) {
  const params = await context.params;
  try {
    // Get user from auth token (middleware will verify JWT)
    const user = request.headers.get('user');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = JSON.parse(user).id;

    // Fetch note
    const note = await prisma.note.findUnique({
      where: { id: params.noteId },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user has access
    const hasAccess = note.owner_id === userId || note.is_public;

    if (!hasAccess) {
      // Check permissions table
      const permission = await prisma.permission.findFirst({
        where: {
          user_id: userId,
          entity_type: 'note',
          entity_id: params.noteId,
        },
      });

      if (!permission) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ noteId: string }> }) {
  const params = await context.params;
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

    // Check if note exists
    const note = await prisma.note.findUnique({
      where: { id: params.noteId },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user has edit permission
    const canEdit = note.owner_id === userId;

    if (!canEdit) {
      // Check permissions table for edit access
      const permission = await prisma.permission.findFirst({
        where: {
          user_id: userId,
          entity_type: 'note',
          entity_id: params.noteId,
          access_level: 'edit',
        },
      });

      if (!permission) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ noteId: string }> }) {
  const params = await context.params;
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
