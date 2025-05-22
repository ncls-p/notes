import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

// DELETE /api/permissions/{permissionId} - Revoke access for a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { permissionId: string } }
) {
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
    
    // Check authentication and permission to manage this specific permission
    // We do this after finding the permission so we can include entity details in the check
    const authResult = await authMiddleware(
      request, 
      'delete', 
      'Permission',
      permissionId
    );
    if (authResult) return authResult;
    
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
  { params }: { params: { permissionId: string } }
) {
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
    
    // Check authentication and permission to manage this specific permission
    const authResult = await authMiddleware(
      request, 
      'update', 
      'Permission',
      permissionId
    );
    if (authResult) return authResult;
    
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