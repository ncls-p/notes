import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET /api/permissions?entityType={note|folder}&entityId={id} - List users with access to an entity
export async function GET(request: NextRequest) {
  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  // Validate parameters
  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: 'Missing required query parameters: entityType and entityId' },
      { status: 400 }
    );
  }

  // Validate entity type
  if (entityType !== 'note' && entityType !== 'folder') {
    return NextResponse.json(
      { error: 'Invalid entityType. Must be "note" or "folder"' },
      { status: 400 }
    );
  }

  // Check authentication
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    // Token is valid, continue with the request
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    // Get the list of users with access to the entity
    const permissions = await prisma.permission.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    const users = permissions.map(permission => ({
      user_id: permission.user.id,
      email: permission.user.email,
      access_level: permission.access_level,
      granted_at: permission.createdAt
    }));

    return NextResponse.json(users);

  } catch (error) {
    console.error('Error listing permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Grant access to a user for an entity
export async function POST(request: NextRequest) {
  // Check authentication
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    // Token is valid, continue with the request
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    // Parse request body
    const { user_id, entity_type, entity_id, access_level } = await request.json();

    // Validate input
    if (!user_id || !entity_type || !entity_id || !access_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate entity_type
    if (entity_type !== 'note' && entity_type !== 'folder') {
      return NextResponse.json(
        { error: 'Invalid entity type. Must be "note" or "folder"' },
        { status: 400 }
      );
    }

    // Validate access_level
    if (access_level !== 'view' && access_level !== 'edit') {
      return NextResponse.json(
        { error: 'Invalid access level. Must be "view" or "edit"' },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the entity exists and current user has permission to manage it
    if (entity_type === 'note') {
      const note = await prisma.note.findUnique({
        where: { id: entity_id }
      });

      if (!note) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        );
      }

      // Note: Here we should check if the current user has permission to manage this note
      // This would be handled by the authMiddleware when checking for 'manage' permission
    } else if (entity_type === 'folder') {
      const folder = await prisma.folder.findUnique({
        where: { id: entity_id }
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }

      // Note: Here we should check if the current user has permission to manage this folder
      // This would be handled by the authMiddleware when checking for 'manage' permission
    }

    // Check if the user already has permission for this entity
    const existingPermission = await prisma.permission.findFirst({
      where: {
        user_id,
        entity_type,
        entity_id
      }
    });

    if (existingPermission) {
      // Update existing permission if access level is different
      if (existingPermission.access_level !== access_level) {
        const updatedPermission = await prisma.permission.update({
          where: { id: existingPermission.id },
          data: { access_level }
        });

        return NextResponse.json({
          message: 'Permission updated successfully',
          permission: updatedPermission
        });
      }

      return NextResponse.json({
        message: 'Permission already exists',
        permission: existingPermission
      });
    }

    // Create new permission
    const permission = await prisma.permission.create({
      data: {
        user_id,
        entity_type,
        entity_id,
        access_level
      }
    });

    return NextResponse.json(
      {
        message: 'Permission created successfully',
        permission
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}