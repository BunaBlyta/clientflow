import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      packageId: true,
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      targetLaunchDate: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (user.role === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!client || client.id !== project.clientId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
  }

  return NextResponse.json({
    id: project.id,
    clientId: project.clientId,
    packageId: project.packageId,
    name: project.name,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    ...(project.targetLaunchDate
      ? { targetLaunchDate: project.targetLaunchDate.toISOString() }
      : {}),
  });
}
