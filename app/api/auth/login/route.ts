import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE, verifyPassword } from '@/app/api/_lib/auth';
import {
  clearLoginAccountRateLimit,
  consumeLoginRateLimit,
} from '@/app/api/_lib/login-rate-limit';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    typeof (body as { email?: unknown }).email !== 'string' ||
    typeof (body as { password?: unknown }).password !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  const email = (body as { email: string }).email.trim().toLowerCase();
  const password = (body as { password: string }).password;
  const rateLimit = await consumeLoginRateLimit(request, email);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await clearLoginAccountRateLimit(email);

  const client = user.role === 'CLIENT'
    ? await prisma.client.findUnique({
        where: { userId: user.id },
        select: { companyName: true, phone: true },
      })
    : null;

  const token = createSessionToken(user.id);
  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      ...(client ? { companyName: client.companyName, phone: client.phone } : {}),
    },
    token,
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
