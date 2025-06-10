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
    // Add other required properties with mock implementations
    ip: "127.0.0.1",
    geo: {},
    // Cast to unknown first to bypass type checking
  } as unknown as NextRequest;
};

describe("/api/auth/refresh-token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
  });

  it("should return 401 when no refresh token is provided", async () => {
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

  it("should return 500 when there are internal errors", async () => {
    // Mock cookies to return a refresh token
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue({ value: "valid-refresh-token" }),
    });

    // Save original values
    const originalJwtSecret = process.env.JWT_SECRET;
    const originalRefreshSecret = process.env.REFRESH_TOKEN_SECRET;

    // Delete environment variables for this test
    delete process.env.JWT_SECRET;
    delete process.env.REFRESH_TOKEN_SECRET;

    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server configuration error");

    // Restore original values
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.REFRESH_TOKEN_SECRET = originalRefreshSecret;
  });
});
