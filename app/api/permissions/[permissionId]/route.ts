import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// DELETE /api/permissions/{permissionId} - Revoke access for a user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ permissionId: string }> }
) {
  const params = await context.params;
  const permissionId = params.permissionId;

  try {
    // Find the permission first to check if it exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
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

    // Delete the permission
    await prisma.permission.delete({
      where: { id: permissionId }
    });

    return NextResponse.json({
      message: 'Permission revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/permissions/{permissionId} - Update access level for a user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ permissionId: string }> }
) {
  const params = await context.params;
  const permissionId = params.permissionId;

  try {
    // Find the permission first to check if it exists
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId }
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
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

    // Parse request body
    const { access_level } = await request.json();

    // Validate access_level
    if (!access_level || (access_level !== 'view' && access_level !== 'edit')) {
      return NextResponse.json(
        { error: 'Invalid access level. Must be "view" or "edit"' },
        { status: 400 }
      );
    }

    // Update the permission
    const updatedPermission = await prisma.permission.update({
      where: { id: permissionId },
      data: { access_level }
    });

    return NextResponse.json({
      message: 'Permission updated successfully',
      permission: updatedPermission
    });

  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}