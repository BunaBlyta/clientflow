import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, hashPassword, verifyPassword } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 8;

// Authenticated password change for a signed-in user: they prove they know the
// current password, then set a new one. This is separate from set-password
// (which is code-driven, for invite activation and reset) — register and
// forgot-password are cut, so this is the only self-serve password path for a
// logged-in client.
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return new Response(null, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    typeof (body as { currentPassword?: unknown }).currentPassword !== 'string' ||
    typeof (body as { newPassword?: unknown }).newPassword !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Current and new password are required' },
      { status: 400 },
    );
  }

  const currentPassword = (body as { currentPassword: string }).currentPassword;
  const newPassword = (body as { newPassword: string }).newPassword;

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` },
      { status: 400 },
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: 'New password must be different from the current one' },
      { status: 400 },
    );
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!record || !verifyPassword(currentPassword, record.passwordHash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.json({ success: true });
}
