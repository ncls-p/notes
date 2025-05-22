import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/public/notes/[token] - Get a publicly shared note by token
 * 
 * This route does not require authentication as it's specifically for public access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  
  if (!token) {
    return NextResponse.json(
      { error: 'Missing token' },
      { status: 400 }
    );
  }

  try {
    // Find the note with the given public share token
    const note = await prisma.note.findUnique({
      where: { 
        public_share_token: token,
        is_public: true // Ensure the note is actually public
      },
      select: {
        id: true,
        title: true,
        content_markdown: true,
        created_at: true,
        updated_at: true,
        owner: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found or not public' },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
    
  } catch (error) {
    console.error('Error retrieving public note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}