import { NextResponse } from "next/server"; // NextRequest is not strictly needed if we use standard Request
import jwt, { JwtPayload } from "jsonwebtoken";

// Use standard Request type, as that's what App Router handlers receive.
// We'll augment it with the user property.
export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

// Adjust ApiHandler to expect AuthenticatedRequest which extends standard Request
type ApiHandler = (
  req: AuthenticatedRequest,
  context: { params: Record<string, string | string[]> },
) => Promise<NextResponse>;
// The second argument for route handlers is an object with a `params` key.

export function withAuth(handler: ApiHandler) {
  // The returned function should match the signature Next.js expects for route handlers
  return async (
    req: Request,
    context: { params: Record<string, string | string[]> },
  ) => {
    const authHeader = req.headers.get("Authorization");
    // Cast req to AuthenticatedRequest for internal use after validation
    const authReq = req as AuthenticatedRequest;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token" },
        { status: 401 },
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token" },
        { status: 401 },
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      // Attach user information to the request object
      // Ensure your JWT payload includes these fields when signing
      if (typeof decoded === "object" && decoded.userId && decoded.email) {
        authReq.user = { id: decoded.userId, email: decoded.email };
      } else {
        // This case should ideally not happen if tokens are signed correctly
        console.error(
          "JWT verification successful, but payload is not as expected:",
          decoded,
        );
        return NextResponse.json(
          { error: "Unauthorized: Invalid token payload" },
          { status: 401 },
        );
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: "Unauthorized: Token expired" },
          { status: 401 },
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid token" },
          { status: 401 },
        );
      }
      console.error("JWT verification error:", error);
      return NextResponse.json(
        { error: "Internal server error during authentication" },
        { status: 500 },
      );
    }

    return handler(authReq, context);
  };
}

// Standalone JWT verification function for API routes that need custom handling
export async function verifyJWT(
  request: Request,
): Promise<
  | { success: true; userId: string; email: string }
  | { success: false; error: string }
> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { success: false, error: "Missing or invalid token" };
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return { success: false, error: "Missing token" };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (typeof decoded === "object" && decoded.userId && decoded.email) {
      return { success: true, userId: decoded.userId, email: decoded.email };
    } else {
      console.error(
        "JWT verification successful, but payload is not as expected:",
        decoded,
      );
      return { success: false, error: "Invalid token payload" };
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: "Token expired" };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: "Invalid token" };
    }
    console.error("JWT verification error:", error);
    return {
      success: false,
      error: "Internal server error during authentication",
    };
  }
}

// Example of a protected API route (not part of this file, just for illustration)
// import { withAuth, AuthenticatedRequest } from '@/lib/auth/serverAuth';
// import { NextResponse } from 'next/server';
//
// async function myProtectedHandler(req: AuthenticatedRequest, context: { params: Record<string, string | string[]> }) {
//   // req.user will be available here
//   return NextResponse.json({ message: `Hello ${req.user?.email}` });
// }
//
// export const GET = withAuth(myProtectedHandler);
