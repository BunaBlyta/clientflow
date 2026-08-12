import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return new Response(null, { status: 401 });

  const client = user.role === 'CLIENT'
    ? await prisma.client.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
    : null;

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(client ? { clientId: client.id } : {}),
  });
}
