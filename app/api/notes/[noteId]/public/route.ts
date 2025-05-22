import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth/middleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * PUT /api/notes/{noteId}/public - Toggle public status for a note
 * 
 * Sets a note as public or private. If making public, generates a unique token for public access.
 * If making private, removes the token.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const noteId = params.noteId;

  // Check authentication and permission to update this note
  const authResult = await authMiddleware(request, 'update', 'Note', noteId);
  if (authResult) return authResult;

  try {
    // Parse request body
    const { isPublic } = await request.json();

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. isPublic must be a boolean value.' },
        { status: 400 }
      );
    }

    // Find the note first to ensure it exists
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Update the note's public status
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        is_public: isPublic,
        public_share_token: isPublic 
          ? note.public_share_token || crypto.randomBytes(32).toString('hex')
          : null // Remove token if making private
      },
      select: {
        id: true,
        title: true,
        is_public: true,
        public_share_token: true
      }
    });

    return NextResponse.json({
      message: isPublic ? 'Note set to public' : 'Note set to private',
      note: updatedNote
    });
    
  } catch (error) {
    console.error('Error toggling note public status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}