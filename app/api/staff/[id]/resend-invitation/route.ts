import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import {
  buildAcceptInviteUrl,
  issueVerificationEmail,
} from '@/app/api/_lib/verification-email';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (user.role !== 'STAFF' || (user.teamRole !== undefined && user.teamRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const { id } = await params;
  const staffUser = await prisma.user.findFirst({
    where: { id, role: 'STAFF' },
    select: { id: true, email: true, name: true },
  });

  if (!staffUser) {
    return NextResponse.json({ error: 'Staff user not found' }, { status: 404 });
  }

  try {
    await issueVerificationEmail({
      ...staffUser,
      acceptInviteUrl: buildAcceptInviteUrl(staffUser.email, new URL(request.url).origin),
    });
    return NextResponse.json({ emailSent: true });
  } catch (error) {
    console.error('Failed to resend staff invitation email', {
      userId: staffUser.id,
      email: staffUser.email,
      error,
    });
    return NextResponse.json({ emailSent: false });
  }
}
