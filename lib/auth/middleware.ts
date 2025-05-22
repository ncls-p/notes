import { NextRequest, NextResponse } from 'next/server';
import { defineAbilityFor } from './ability';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to check if user is authenticated and has permission to perform an action
 * 
 * @param request - The incoming request
 * @param action - The action to check permission for ('create', 'read', 'update', 'delete')
 * @param subject - The subject of the action ('Note', 'Folder', etc.)
 * @param entityId - Optional ID of the entity to check permissions for
 * @returns NextResponse or null if authorized
 */
export async function authMiddleware(
  request: NextRequest,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  subject: string,
  entityId?: string
) {
  // Get Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized - No valid token provided' },
      { status: 401 }
    );
  }
  
  const token = authHeader.split(' ')[1];
  let payload: JwtPayload;
  
  try {
    // Verify JWT token
    payload = verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }
  
  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }
    
    // Define abilities for user
    const ability = defineAbilityFor(user);
    
    // Check if user can perform the action on the subject
    let subjectWithId: any = subject;
    if (entityId) {
      subjectWithId = { id: entityId };
    }
    
    if (!ability.can(action, subject as any, subjectWithId)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // User is authorized
    return null;
    
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}