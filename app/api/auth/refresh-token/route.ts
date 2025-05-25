import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 },
      );
    }

    if (!process.env.REFRESH_TOKEN_SECRET || !process.env.JWT_SECRET) {
      console.error("JWT_SECRET or REFRESH_TOKEN_SECRET not defined");
      return NextResponse.json(
        { error: "Internal server configuration error" },
        { status: 500 },
      );
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
      ) as jwt.JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
          { error: "Refresh token expired" },
          { status: 401 },
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return NextResponse.json(
          { error: "Invalid refresh token" },
          { status: 401 },
        );
      }
      console.error("Refresh token verification error:", error);
      return NextResponse.json(
        { error: "Internal server error during token verification" },
        { status: 500 },
      );
    }

    // Ensure the token payload is valid
    if (!decoded.userId) {
      return NextResponse.json(
        { error: "Invalid refresh token payload" },
        { status: 401 },
      );
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    const response = NextResponse.json({
      message: "Token refreshed successfully",
      accessToken,
      user: { id: user.id, email: user.email },
    });

    // Set new refresh token in HttpOnly cookie
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    // Set auth_token cookie that middleware expects
    response.cookies.set("auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes (same as access token expiry)
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
