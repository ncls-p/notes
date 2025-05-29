import { GET } from '@/app/api/auth/logout/route';
import { NextRequest } from 'next/server';

// Mock NextRequest
const createMockRequest = (): NextRequest => {
  return {
    headers: new Headers(),
    nextUrl: {
      pathname: '/api/auth/logout',
    },
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
    },
    // Add other required properties with mock implementations
    ip: '127.0.0.1',
    geo: {},
    // Cast to unknown first to bypass type checking
  } as unknown as NextRequest;
};

describe('/api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully log out and return success message', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Logged out successfully');
  });

  it('should handle logout even when no cookies are present', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Logged out successfully');
  });
});