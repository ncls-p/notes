import { POST } from "@/app/api/auth/refresh-token/route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// Mock NextRequest
const createMockRequest = (): NextRequest => {
  return {
    headers: new Headers(),
    nextUrl: {
      pathname: "/api/auth/refresh-token",
    },
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
    },
    ip: "127.0.0.1",
    geo: {},
  } as unknown as NextRequest;
};

describe("/api/auth/refresh-token basic integration", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret-integration";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret-integration";
  });

  it("should handle test environment correctly", async () => {
    // Mock cookies to return no refresh token
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No refresh token provided");
  });
});
