import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import {
  buildAcceptInviteUrl,
  issueVerificationEmail,
} from '@/app/api/_lib/verification-email';
import {
  invalidStaffRequest,
  isUniqueConstraintError,
  serializeStaffUser,
  staffUserSelect,
} from './_lib';

export async function handleStaffInvite(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'STAFF' || (user.teamRole !== undefined && user.teamRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidStaffRequest('Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalidStaffRequest('Request body must be an object');
  }

  const values = body as Record<string, unknown>;
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const email = typeof values.email === 'string' ? values.email.trim().toLowerCase() : '';
  const teamRole = values.teamRole === 'ADMIN' ? 'ADMIN' : 'USER';

  if (!name || name.length > 120) {
    return invalidStaffRequest('Name is required and must be 120 characters or fewer');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return invalidStaffRequest('A valid email is required');
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
        teamRole,
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
