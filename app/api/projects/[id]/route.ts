import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializePackageSummary } from '@/app/api/packages/serialize';
import { ProjectStatus } from '@/lib/generated/prisma/enums';
import { createNotification, scheduleEntityChanged, scheduleNotificationEffects } from '@/app/api/_lib/notifications';

export const runtime = 'nodejs';

const PAYMENT_GATE_ERROR =
  'The deposit must be paid before the project can move forward. Discovery is set automatically after confirmed payment.';

const projectSelect = {
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
} as const;

function serializeProject(project: {
  id: string;
  clientId: string;
  packageId: string | null;
  package: {
    id: string;
    name: string;
    price: number | string | { toString(): string };
    currency: string;
  } | null;
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
    package: project.package ? serializePackageSummary(project.package) : null,
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

  if (project.status === 'PENDING') {
    if (nextStatus === 'DISCOVERY') {
      return NextResponse.json({ error: PAYMENT_GATE_ERROR }, { status: 409 });
    }

    const depositInvoice = await prisma.invoice.findFirst({
      where: { projectId: id, type: 'DEPOSIT' },
      orderBy: { createdAt: 'asc' },
      select: { status: true },
    });

    const depositIsRequired = project.packageId !== null || depositInvoice !== null;
    if (depositIsRequired && depositInvoice?.status !== 'PAID') {
      return NextResponse.json({ error: PAYMENT_GATE_ERROR }, { status: 409 });
    }
  }

  const result = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.project.update({
      where: { id },
      data: { status: nextStatus },
      select: projectSelect,
    });

    await transaction.note.create({
      data: {
        projectId: id,
        content: `Project status changed from ${formatProjectStatus(project.status)} to ${formatProjectStatus(nextStatus)}.`,
        isSystem: true,
      },
    });

    const client = await transaction.client.findUnique({
      where: { id: project.clientId },
      select: { userId: true },
    });

    const notificationIds: string[] = [];
    if (client) {
      const notificationId = await createNotification(transaction, {
        userId: client.userId,
        type: 'PROJECT_STAGE_CHANGED',
        projectId: id,
        title: `${project.name} moved to ${formatProjectStatus(nextStatus)}`,
        message: `Your project moved from ${formatProjectStatus(project.status)} to ${formatProjectStatus(nextStatus)}.`,
      });
      if (notificationId) notificationIds.push(notificationId);
    }

    return { updated, notificationIds };
  });

  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({ entity: 'project', id, projectId: id });

  return NextResponse.json(serializeProject(result.updated));
}

function formatProjectStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
