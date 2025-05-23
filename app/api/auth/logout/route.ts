import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Logged out successfully' },
    {
      status: 200,
      headers: {
        'Set-Cookie': `auth_token=; Path=/; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=0`
      }
    }
  );
}
