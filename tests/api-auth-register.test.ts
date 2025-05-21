// tests/api-auth-register.test.ts

describe('/api/auth/register', () => {
  it('should register a new user with valid email and password', async () => {
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'StrongPassword123!'
      })
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('email', 'testuser@example.com');
    expect(data).not.toHaveProperty('password_hash');
  });
});
