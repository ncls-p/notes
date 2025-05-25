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
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');

    console.log('[API/Folders] Received query params:', { parentId, sortBy, sortOrder });

    // Validate query parameters
    const validatedQuery = listFoldersSchema.safeParse({
      parentId: parentId === 'null' ? null : parentId,
      sortBy: sortBy,
      sortOrder: sortOrder,
    });

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedQuery.error.errors },
        { status: 400 }
      );
    }
    const {
      parentId: validParentId,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
    } = validatedQuery.data;

    // If parentId is provided and not null, verify the parent folder exists and belongs to the user
    if (validParentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: {
          id: validParentId,
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

    const orderByClause: { [key: string]: 'asc' | 'desc' } = {};
    if (validSortBy) {
      orderByClause[validSortBy] = validSortOrder;
    } else {
      orderByClause['name'] = 'asc'; // Default sort
    }
    console.log('[API/Folders] Constructed orderBy clause:', orderByClause);

    const folders = await prisma.folder.findMany({
      where: {
        ownerId: authResult.userId,
        parentId: validParentId,
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
      orderBy: orderByClause,
    });

    return NextResponse.json(
      folders.map((folder) => ({
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
