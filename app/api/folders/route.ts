import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { verifyJWT } from '@/lib/auth/serverAuth';

const prisma = new PrismaClient();

// Schema for creating a folder
const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name too long'),
  parentId: z.string().uuid().optional().nullable(),
});

// Schema for listing folders
const listFoldersSchema = z.object({
  parentId: z.string().uuid().optional().nullable(),
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
    const validatedData = createFolderSchema.parse(body);

    // If parentId is provided, verify the parent folder exists and belongs to the user
    if (validatedData.parentId) {
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
    }

    // Check for duplicate folder names in the same parent
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: validatedData.name,
        parentId: validatedData.parentId,
        ownerId: authResult.userId,
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      );
    }

    const folder = await prisma.folder.create({
      data: {
        name: validatedData.name,
        parentId: validatedData.parentId,
        ownerId: authResult.userId,
      },
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
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      parent: folder.parent,
      childrenCount: folder._count.children,
      notesCount: folder._count.notes,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating folder:', error);
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
    const parentId = searchParams.get('parentId');

    // Validate parentId if provided
    const queryData = listFoldersSchema.parse({
      parentId: parentId === 'null' ? null : parentId,
    });

    // If parentId is provided and not null, verify the parent folder exists and belongs to the user
    if (queryData.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: queryData.parentId,
          ownerId: authResult.userId,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found or access denied' },
          { status: 404 }
        );
      }
    }

    const folders = await prisma.folder.findMany({
      where: {
        ownerId: authResult.userId,
        parentId: queryData.parentId,
      },
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
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(
      folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId,
        parent: folder.parent,
        childrenCount: folder._count.children,
        notesCount: folder._count.notes,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      }))
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}