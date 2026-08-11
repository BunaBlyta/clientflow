import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/prisma';
import { verifyCode } from '@/app/api/_lib/verification';

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
    typeof (body as { code?: unknown }).code !== 'string'
  ) {
    return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
  }

  const email = (body as { email: string }).email.trim().toLowerCase();
  const code = (body as { code: string }).code.trim();
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
    return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      isActive: true,
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    verified: true,
    user: {
      id: verifiedUser.id,
      email: verifiedUser.email,
      name: verifiedUser.name,
      role: verifiedUser.role,
      createdAt: verifiedUser.createdAt.toISOString(),
    },
  });
}

