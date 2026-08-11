import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const requests = await prisma.projectRequest.findMany({
    select: {
      id: true,
      packageId: true,
      name: true,
      email: true,
      companyName: true,
      message: true,
      status: true,
      reviewedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    requests.map((projectRequest) => ({
      id: projectRequest.id,
      packageId: projectRequest.packageId,
      prospectName: projectRequest.name,
      prospectEmail: projectRequest.email,
      ...(projectRequest.companyName ? { companyName: projectRequest.companyName } : {}),
      ...(projectRequest.message ? { message: projectRequest.message } : {}),
      status: projectRequest.status,
      createdAt: projectRequest.createdAt.toISOString(),
      ...(projectRequest.reviewedAt
        ? { reviewedAt: projectRequest.reviewedAt.toISOString() }
        : {}),
    })),
  );
}

