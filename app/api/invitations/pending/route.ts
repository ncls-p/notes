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

// GET /api/invitations/pending - List pending invitations for the authenticated user
export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await authMiddleware(request, 'read', 'Invitation');
  if (authResult) return authResult;
  
  try {
    // Extract token and get user email
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
    
    // Find pending invitations for the user's email
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        invitee_email: user.email,
        status: 'pending',
        expires_at: {
          gt: new Date() // Only show invitations that haven't expired
        }
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format the response
    const formattedInvitations = pendingInvitations.map(invitation => ({
      id: invitation.id,
      entity_id: invitation.entity_id,
      entity_type: invitation.entity_type,
      access_level: invitation.access_level,
      expires_at: invitation.expires_at,
      created_at: invitation.createdAt,
      inviter: {
        id: invitation.inviter.id,
        email: invitation.inviter.email
      }
    }));
    
    return NextResponse.json(formattedInvitations);
    
  } catch (error) {
    console.error('Error listing pending invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}