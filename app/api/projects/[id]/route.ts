import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { ProjectStatus } from '@/lib/generated/prisma/enums';

export const runtime = 'nodejs';

const projectSelect = {
  id: true,
  clientId: true,
  packageId: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  targetLaunchDate: true,
} as const;

function serializeProject(project: {
  id: string;
  clientId: string;
  packageId: string | null;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  targetLaunchDate: Date | null;
}) {
  return {
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
  };
}

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
    select: projectSelect,
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

  return NextResponse.json(serializeProject(project));
}

export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;
  if (typeof status !== 'string' || !Object.values(ProjectStatus).includes(status as ProjectStatus)) {
    return NextResponse.json({ error: 'A valid project status is required' }, { status: 400 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id }, select: projectSelect });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const nextStatus = status as ProjectStatus;
  if (project.status === nextStatus) {
    return NextResponse.json(serializeProject(project));
  }

  const updatedProject = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.project.update({
      where: { id },
      data: { status: nextStatus },
      select: projectSelect,
    });

    await transaction.note.create({
      data: {
        projectId: id,
        content: `Status changed from ${formatProjectStatus(project.status)} to ${formatProjectStatus(nextStatus)}.`,
        isSystem: true,
      },
    });

    return updated;
  });

  return NextResponse.json(serializeProject(updatedProject));
}

function formatProjectStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
