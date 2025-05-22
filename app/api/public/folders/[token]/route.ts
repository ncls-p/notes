import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/public/folders/[token] - Get a publicly shared folder by token
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
    // First, find the folder to get its owner_id
    const folderInfo = await prisma.folder.findUnique({
      where: { 
        public_share_token: token,
        is_public: true // Ensure the folder is actually public
      },
      select: {
        id: true,
        owner_id: true
      }
    });

    if (!folderInfo) {
      return NextResponse.json(
        { error: 'Folder not found or not public' },
        { status: 404 }
      );
    }

    // Now fetch the complete folder with related data
    const folder = await prisma.folder.findUnique({
      where: { 
        id: folderInfo.id
      },
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
        owner: {
          select: {
            id: true,
            email: true
          }
        },
        // Include notes that belong to this folder
        notes: {
          where: {
            // Only include public notes or notes owned by the folder owner
            OR: [
              { is_public: true },
              { owner_id: folderInfo.owner_id }
            ]
          },
          select: {
            id: true,
            title: true,
            created_at: true,
            updated_at: true,
            is_public: true
          }
        },
        // Include sub-folders
        sub_folders: {
          where: {
            // Only include public sub-folders or sub-folders owned by the folder owner
            OR: [
              { is_public: true },
              { owner_id: folderInfo.owner_id }
            ]
          },
          select: {
            id: true,
            name: true,
            created_at: true,
            is_public: true
          }
        }
      }
    });

    return NextResponse.json(folder);
    
  } catch (error) {
    console.error('Error retrieving public folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}