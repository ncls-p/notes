import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const createNoteSchema = z.object({
  title: z.string().min(1),
  content_markdown: z.string().optional(),
  folder_id: z.string().optional(),
});

type CreateNoteInput = z.infer<typeof createNoteSchema>;

export async function POST(request: NextRequest) {
  try {
    // Get user from auth token (middleware will verify JWT)
    const user = request.headers.get('user');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = JSON.parse(user).id;

    // Validate input
    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    // Create note
    const note = await prisma.note.create({
      data: {
        ...validatedData,
        owner_id: userId,
      },
    });

    return NextResponse.json(note, { status: 201 });
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
    // Get user from auth token (middleware will verify JWT)
    const user = request.headers.get('user');
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userId = JSON.parse(user).id;

    // Get folder_id from query parameter
    const { searchParams } = new URL(request.url);
    const folder_id = searchParams.get('folder_id');

    // Fetch notes
    const notes = await prisma.note.findMany({
      where: {
        owner_id: userId,
        folder_id: folder_id || null,
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
