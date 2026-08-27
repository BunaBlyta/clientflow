import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, hashPassword, SESSION_COOKIE } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { verifyCode } from '@/app/api/_lib/verification';

export const runtime = 'nodejs';

const INVALID_CODE_MESSAGE = 'Invalid or expired verification code';

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
    typeof (body as { code?: unknown }).code !== 'string' ||
    typeof (body as { password?: unknown }).password !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Email, verification code, and password are required' },
      { status: 400 },
    );
  }

  const email = (body as { email: string }).email.trim().toLowerCase();
  const code = (body as { code: string }).code.trim();
  const password = (body as { password: string }).password;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters long' },
      { status: 400 },
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
      verificationCodeHash: true,
      verificationCodeExpiresAt: true,
    },
  });

  if (
    !user ||
    !user.verificationCodeExpiresAt ||
    user.verificationCodeExpiresAt <= new Date() ||
    !verifyCode(code, user.verificationCodeHash)
  ) {
    return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashPassword(password),
      isActive: true,
      emailVerifiedAt: new Date(),
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      client: { select: { companyName: true, phone: true } },
    },
  });

  const token = createSessionToken(updatedUser.id);
  const response = NextResponse.json({
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt.toISOString(),
      ...(updatedUser.client
        ? { companyName: updatedUser.client.companyName, phone: updatedUser.client.phone }
        : {}),
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
