import { POST } from '@/app/api/auth/refresh-token/route';

// Simple test using the global mocks from setup-node.js
describe('/api/auth/refresh-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  });

  it('should handle errors gracefully when cookies are not available', async () => {
    // In test environment, cookies() might fail, which should be caught and return 500
    const request = new Request('http://localhost/api/auth/refresh-token', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    // Should return 500 since cookies() fails in test environment
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should return 500 when there are internal errors', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.REFRESH_TOKEN_SECRET;

    const request = new Request('http://localhost/api/auth/refresh-token', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});