import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth/serverAuth';

const prisma = new PrismaClient();

// Schema for updating a folder
const updateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long').optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { folderId } = await params;

    // Verify folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: authResult.userId,
      },
    });

    if (!existingFolder) {
      return NextResponse.json(
        { error: 'Folder not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateFolderSchema.parse(body);

    // If parentId is being changed, verify the new parent exists and belongs to the user
    if (validatedData.parentId !== undefined && validatedData.parentId !== null) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: validatedData.parentId,
          ownerId: authResult.userId,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found or access denied' },
          { status: 404 }
        );
      }

      // Check for cyclical structure - ensure the folder is not being moved into its own child
      const isDescendant = await checkIfDescendant(folderId, validatedData.parentId);
      if (isDescendant) {
        return NextResponse.json(
          { error: 'Cannot move folder into its own descendant' },
          { status: 400 }
        );
      }
    }

    // If name is being changed, check for duplicates in the target parent
    if (validatedData.name) {
      const targetParentId = validatedData.parentId !== undefined ? validatedData.parentId : existingFolder.parentId;

      const duplicateFolder = await prisma.folder.findFirst({
        where: {
          name: validatedData.name,
          parentId: targetParentId,
          ownerId: authResult.userId,
          id: { not: folderId }, // Exclude current folder
        },
      });

      if (duplicateFolder) {
        return NextResponse.json(
          { error: 'A folder with this name already exists in this location' },
          { status: 409 }
        );
      }
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: validatedData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedFolder.id,
      name: updatedFolder.name,
      parentId: updatedFolder.parentId,
      parent: updatedFolder.parent,
      childrenCount: updatedFolder._count.children,
      notesCount: updatedFolder._count.notes,
      createdAt: updatedFolder.createdAt,
      updatedAt: updatedFolder.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { folderId } = await params;

    // Verify folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        ownerId: authResult.userId,
      },
      include: {
        _count: {
          select: {
            children: true,
            notes: true,
          },
        },
      },
    });

    if (!existingFolder) {
      return NextResponse.json(
        { error: 'Folder not found or access denied' },
        { status: 404 }
      );
    }

    // For MVP: disallow deleting non-empty folders
    if (existingFolder._count.children > 0 || existingFolder._count.notes > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder that contains subfolders or notes' },
        { status: 400 }
      );
    }

    await prisma.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if a folder would become a descendant of itself
async function checkIfDescendant(folderId: string, potentialParentId: string): Promise<boolean> {
  if (folderId === potentialParentId) {
    return true;
  }

  const parent = await prisma.folder.findUnique({
    where: { id: potentialParentId },
    select: { parentId: true },
  });

  if (!parent || !parent.parentId) {
    return false;
  }

  return checkIfDescendant(folderId, parent.parentId);
}