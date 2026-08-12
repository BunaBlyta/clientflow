import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { issueVerificationEmail } from '@/app/api/_lib/verification-email';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  try {
    await issueVerificationEmail(client.user);
    return NextResponse.json({ emailSent: true });
  } catch (error) {
    console.error('Failed to resend client invitation email', {
      clientId: id,
      userId: client.user.id,
      email: client.user.email,
      error,
    });
    return NextResponse.json({ emailSent: false });
  }
}
