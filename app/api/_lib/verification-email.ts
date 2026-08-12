import { prisma } from '@/app/api/_lib/prisma';
import { createVerificationCode } from '@/app/api/_lib/verification';
import { sendVerificationEmail } from '@/app/api/_lib/resend';

export function buildAcceptInviteUrl(email: string, requestOrigin: string) {
  const baseUrl = process.env.APP_URL?.trim() || requestOrigin;
  const url = new URL('/accept-invite', baseUrl);
  url.searchParams.set('email', email);
  return url.toString();
}

export async function issueVerificationEmail({
  id,
  email,
  name,
  acceptInviteUrl,
}: {
  id: string;
  email: string;
  name: string;
  acceptInviteUrl?: string;
}) {
  const verification = createVerificationCode();

  await prisma.user.update({
    where: { id },
    data: {
      verificationCodeHash: verification.hash,
      verificationCodeExpiresAt: verification.expiresAt,
    },
  });

  await sendVerificationEmail({
    email,
    name,
    code: verification.code,
    ...(acceptInviteUrl ? { acceptInviteUrl } : {}),
  });
}
