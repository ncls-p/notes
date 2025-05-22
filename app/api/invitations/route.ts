import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { authMiddleware } from '@/lib/auth/middleware';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// POST /api/invitations - Create a new invitation
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const authResult = await authMiddleware(request, 'create', 'Invitation');
  if (authResult) return authResult;
  
  try {
    // Extract token and get user ID
    const authHeader = request.headers.get('Authorization');
    const token = authHeader!.split(' ')[1];
    const payload = verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const inviterId = payload.userId;
    
    // Parse request body
    const { entity_id, entity_type, invitee_email, access_level } = await request.json();
    
    // Validate input
    if (!entity_id || !entity_type || !invitee_email || !access_level) {
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
    
    // Check entity exists and user owns it
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
      
      if (note.owner_id !== inviterId) {
        return NextResponse.json(
          { error: 'You do not have permission to share this note' },
          { status: 403 }
        );
      }
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
      
      if (folder.owner_id !== inviterId) {
        return NextResponse.json(
          { error: 'You do not have permission to share this folder' },
          { status: 403 }
        );
      }
    }
    
    // Check if invitee already has permission
    const existingPermission = await prisma.permission.findFirst({
      where: {
        entity_id,
        entity_type,
        user: {
          email: invitee_email
        }
      }
    });
    
    if (existingPermission) {
      return NextResponse.json(
        { error: 'User already has access to this entity' },
        { status: 409 }
      );
    }
    
    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        entity_id,
        entity_type,
        invitee_email,
        status: 'pending'
      }
    });
    
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'There is already a pending invitation for this user and entity' },
        { status: 409 }
      );
    }
    
    // Generate a secure token for the invitation
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration date (30 days from now)
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 30);
    
    // Create the invitation
    const invitation = await prisma.invitation.create({
      data: {
        inviter_id: inviterId,
        invitee_email,
        entity_type,
        entity_id,
        access_level,
        token,
        expires_at,
        status: 'pending'
      }
    });
    
    // TODO: Send email notification to invitee (Task-CP-003.2)
    
    return NextResponse.json(
      {
        id: invitation.id,
        entity_id: invitation.entity_id,
        entity_type: invitation.entity_type,
        invitee_email: invitation.invitee_email,
        access_level: invitation.access_level,
        status: invitation.status,
        expires_at: invitation.expires_at,
        created_at: invitation.createdAt
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}