import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: user.role === 'CLIENT' ? { userId: user.id } : undefined,
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      companyName: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    clients.map((client) => ({
      id: client.id,
      userId: client.userId,
      companyName: client.companyName ?? client.name,
      contactName: client.name,
      email: client.email,
      ...(client.phone ? { phone: client.phone } : {}),
      createdAt: client.createdAt.toISOString(),
    })),
  );
}

