import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/api/_lib/prisma';
import { issueVerificationEmail } from '@/app/api/_lib/verification-email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || typeof (body as { email?: unknown }).email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const email = (body as { email: string }).email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'No Clientflow account found for this email' },
      { status: 404 },
    );
  }

  try {
    await issueVerificationEmail(user);
  } catch {
    console.error('Verification email delivery failed after registering reset request', {
      email,
      userId: user.id,
    });
    return NextResponse.json({ sent: false, registered: true });
  }

  return NextResponse.json({ sent: true, registered: true });
}
