import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/app/api/_lib/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  void request;
  const response = NextResponse.json({ loggedOut: true });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
