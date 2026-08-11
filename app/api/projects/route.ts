import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializePackageSummary } from '@/app/api/packages/serialize';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const where = user.role === 'CLIENT'
    ? {
        client: { userId: user.id },
      }
    : {};
  const projects = await prisma.project.findMany({
    where,
    select: {
      id: true,
      clientId: true,
      packageId: true,
      package: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
        },
      },
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      targetLaunchDate: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(
    projects.map((project) => ({
      id: project.id,
      clientId: project.clientId,
      packageId: project.packageId,
      package: project.package ? serializePackageSummary(project.package) : null,
      name: project.name,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      ...(project.targetLaunchDate
        ? { targetLaunchDate: project.targetLaunchDate.toISOString() }
        : {}),
    })),
  );
}
