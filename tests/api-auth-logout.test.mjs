import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('/api/auth/logout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should clear the auth token cookie', async () => {
    const { POST } = await import('../app/api/auth/logout/route');

    const mockRequest = new NextRequest('http://localhost:3001/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('message', 'Logged out successfully');

    // Check for Set-Cookie header with cleared token
    const headers = new Headers(response.headers);
    const setCookie = headers.get('Set-Cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('auth_token=');
    expect(setCookie).toContain('Max-Age=0');
  });
});
