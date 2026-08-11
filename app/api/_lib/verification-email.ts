import { prisma } from '@/app/api/_lib/prisma';
import { createVerificationCode } from '@/app/api/_lib/verification';
import { sendVerificationEmail } from '@/app/api/_lib/resend';

export async function issueVerificationEmail({
  id,
  email,
  name,
}: {
  id: string;
  email: string;
  name: string;
}) {
  const verification = createVerificationCode();

  await prisma.user.update({
    where: { id },
    data: {
      verificationCodeHash: verification.hash,
      verificationCodeExpiresAt: verification.expiresAt,
    },
  });

  await sendVerificationEmail({ email, name, code: verification.code });
}
