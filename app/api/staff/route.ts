import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import {
  buildAcceptInviteUrl,
  issueVerificationEmail,
} from '@/app/api/_lib/verification-email';

export const runtime = 'nodejs';

const staffUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

function serializeStaffUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const staffUsers = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: staffUserSelect,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(staffUsers.map(serializeStaffUser));
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidRequest('Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalidRequest('Request body must be an object');
  }

  const values = body as Record<string, unknown>;
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const email = typeof values.email === 'string' ? values.email.trim().toLowerCase() : '';

  if (!name || name.length > 120) {
    return invalidRequest('Name is required and must be 120 characters or fewer');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return invalidRequest('A valid email is required');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: 'A user with that email already exists' },
      { status: 409 },
    );
  }

  let createdUser;
  try {
    createdUser = await prisma.user.create({
      data: {
        email,
        name,
        role: 'STAFF',
        isActive: false,
      },
      select: staffUserSelect,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: 'A user with that email already exists' },
        { status: 409 },
      );
    }
    throw error;
  }

  let emailSent = true;
  try {
    await issueVerificationEmail({
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      acceptInviteUrl: buildAcceptInviteUrl(createdUser.email, new URL(request.url).origin),
    });
  } catch (error) {
    emailSent = false;
    console.error('Failed to send staff invitation email after user creation', {
      userId: createdUser.id,
      email: createdUser.email,
      error,
    });
  }

  return NextResponse.json(
    { user: serializeStaffUser(createdUser), emailSent },
    { status: 201 },
  );
}
