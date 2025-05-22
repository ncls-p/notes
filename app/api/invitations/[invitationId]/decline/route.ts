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

// POST /api/invitations/{invitationId}/decline - Decline an invitation
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
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
    
    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }
    
    // Update invitation status to declined
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'declined' }
    });
    
    return NextResponse.json({
      message: 'Invitation declined successfully',
      invitation: {
        id: updatedInvitation.id,
        status: updatedInvitation.status
      }
    });
    
  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}