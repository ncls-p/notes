import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth/middleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * PUT /api/folders/{folderId}/public - Toggle public status for a folder
 * 
 * Sets a folder as public or private. If making public, generates a unique token for public access.
 * If making private, removes the token.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const folderId = params.folderId;

  // Check authentication and permission to update this folder
  const authResult = await authMiddleware(request, 'update', 'Folder', folderId);
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

    // Find the folder first to ensure it exists
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Update the folder's public status
    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        is_public: isPublic,
        public_share_token: isPublic 
          ? folder.public_share_token || crypto.randomBytes(32).toString('hex')
          : null // Remove token if making private
      },
      select: {
        id: true,
        name: true,
        is_public: true,
        public_share_token: true
      }
    });

    return NextResponse.json({
      message: isPublic ? 'Folder set to public' : 'Folder set to private',
      folder: updatedFolder
    });
    
  } catch (error) {
    console.error('Error toggling folder public status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}