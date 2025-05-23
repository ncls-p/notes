import { NextResponse } from 'next/server';
// Import AuthenticatedRequest if it's exported from serverAuth, or define locally if preferred
import { withAuth, AuthenticatedRequest } from '@/lib/auth/serverAuth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The AuthenticatedRequest type is now imported from serverAuth.ts
// interface AuthenticatedRequest extends Request {
//   user?: { id: string; email: string };
// }

async function meHandler(req: AuthenticatedRequest, context: { params: Record<string, string | string[]> }) {
  // The second argument `context` is passed by Next.js App Router, even if not used here.
  // `withAuth` is now adjusted to pass this through.
  if (!req.user) {
    // This case should ideally be caught by withAuth, but as a safeguard:
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Optionally, re-fetch user from DB if you need the freshest data
    // For this example, we'll return what's in the token.
    // If you need more data than what's in the token, fetch it here:
    // const userFromDb = await prisma.user.findUnique({ where: { id: req.user.id } });
    // if (!userFromDb) {
    //   return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // }
    // const { password_hash, ...userWithoutPassword } = userFromDb;
    // return NextResponse.json(userWithoutPassword);

    return NextResponse.json({ id: req.user.id, email: req.user.email });

  } catch (error) {
    console.error('Error in /api/users/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(meHandler);
// No longer need `as any` since `withAuth` and `meHandler` signatures are aligned.
// The comments below are now addressed by the changes in `serverAuth.ts`.