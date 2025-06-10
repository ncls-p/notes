import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/jwt-edge";
import { middlewareLogger, logSecurityEvent } from "@/lib/logger";
import { requestLoggingMiddleware } from "@/lib/middleware/logging";

// Define paths that don't require authentication
const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/login",
  "/register",
  "/public",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Add request logging context
  const { requestId, headers: requestHeaders } =
    requestLoggingMiddleware(request);

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
    middlewareLogger.debug(
      {
        requestId,
        path: request.nextUrl.pathname,
        reason: "public_path",
      },
      "Skipping auth middleware for public path",
    );
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth_token")?.value;

  if (!authToken) {
    middlewareLogger.warn(
      {
        requestId,
        path: request.nextUrl.pathname,
        userAgent: request.headers.get("user-agent"),
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
      },
      "Access attempt without auth token",
    );

    logSecurityEvent("unauthorized_access", {
      requestId,
      path: request.nextUrl.pathname,
      reason: "missing_token",
      userAgent: request.headers.get("user-agent"),
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    });

    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      middlewareLogger.error(
        {
          requestId,
          error: "JWT_SECRET not configured",
        },
        "Critical configuration error: JWT_SECRET missing",
      );
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = await verifyJWT(authToken, secret);

    middlewareLogger.debug(
      {
        requestId,
        userId: decoded.userId,
        path: request.nextUrl.pathname,
        duration: Date.now() - startTime,
      },
      "Authentication successful",
    );

    // Add user context and request metadata to headers
    requestHeaders.set("user", JSON.stringify(decoded));
    requestHeaders.set("x-user-id", decoded.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    middlewareLogger.error(
      {
        requestId,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
        path: request.nextUrl.pathname,
        duration: Date.now() - startTime,
      },
      "Authentication failed",
    );

    logSecurityEvent("auth_failure", {
      requestId,
      path: request.nextUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
      userAgent: request.headers.get("user-agent"),
      ip:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
    });

    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/((?!auth/login|auth/register|public).)*",
  ],
};
