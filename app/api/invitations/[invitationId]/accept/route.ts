import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { authMiddleware } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// POST /api/invitations/{invitationId}/accept - Accept an invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  // Check authentication
  const authResult = await authMiddleware(request, 'update', 'Invitation');
  if (authResult) return authResult;
  
  const invitationId = params.invitationId;
  
  try {
    // Extract token and get user details
    const authHeader = request.headers.get('Authorization');
    const token = authHeader!.split(' ')[1];
    const payload = verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const userId = payload.userId;
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    });
    
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }
    
    // Check if invitation is for the authenticated user
    if (invitation.invitee_email !== user.email) {
      return NextResponse.json(
        { error: 'This invitation is not addressed to you' },
        { status: 403 }
      );
    }
    
    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }
    
    // Check if invitation has expired
    if (invitation.expires_at < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }
    
    // Start a transaction to update invitation status and create permission
    const result = await prisma.$transaction(async (prisma) => {
      // Update invitation status
      const updatedInvitation = await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'accepted' }
      });
      
      // Create permission entry
      const permission = await prisma.permission.create({
        data: {
          user_id: userId,
          entity_type: invitation.entity_type,
          entity_id: invitation.entity_id,
          access_level: invitation.access_level
        }
      });
      
      return { updatedInvitation, permission };
    });
    
    return NextResponse.json({
      message: 'Invitation accepted successfully',
      invitation: {
        id: result.updatedInvitation.id,
        status: result.updatedInvitation.status
      },
      permission: {
        id: result.permission.id,
        entity_type: result.permission.entity_type,
        entity_id: result.permission.entity_id,
        access_level: result.permission.access_level
      }
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}