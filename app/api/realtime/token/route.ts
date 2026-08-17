import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { createAblyTokenRequest } from '@/app/api/_lib/notifications';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json({ error: 'Realtime is not configured' }, { status: 503 });
  }

  try {
    const tokenRequest = await createAblyTokenRequest(user.id, user.role === 'STAFF');
    return NextResponse.json(tokenRequest, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Unable to create Ably token request', error);
    return NextResponse.json({ error: 'Realtime is temporarily unavailable' }, { status: 503 });
  }
}
