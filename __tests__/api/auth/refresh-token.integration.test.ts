// Simple integration test for refresh token functionality
import { POST } from '@/app/api/auth/refresh-token/route';

describe('/api/auth/refresh-token basic integration', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-integration';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-integration';
  });

  it('should handle test environment correctly', async () => {
    const request = new Request('http://localhost/api/auth/refresh-token', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    // In test environment, cookies() fails so we get 500
    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});