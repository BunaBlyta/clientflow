import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { createNotification, scheduleEntityChanged, scheduleNotificationEffects } from '@/app/api/_lib/notifications';
import type { Prisma } from '@/lib/generated/prisma/client';
import { paginatedResponse, readPagination } from '@/lib/pagination';

export const runtime = 'nodejs';

function serializeProjectRequest(projectRequest: {
  id: string;
  packageId: string;
  name: string;
  email: string;
  companyName: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
}) {
  return {
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
  };
}

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function readOptionalText(body: Record<string, unknown>, key: string, maxLength: number) {
  const value = body[key];
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (trimmed.length > maxLength) return null;
  return trimmed || undefined;
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const pagination = readPagination(searchParams);
  if (pagination.enabled && 'error' in pagination) return invalidRequest(pagination.error);
  const search = searchParams.get('search')?.trim() ?? '';
  const where: Prisma.ProjectRequestWhereInput = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { companyName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ],
  } : {};
  const requests = await prisma.projectRequest.findMany({
    where,
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
    ...(pagination.enabled ? { skip: pagination.value.skip, take: pagination.value.pageSize } : {}),
  });

  const serialized = requests.map(serializeProjectRequest);
  if (!pagination.enabled) return NextResponse.json(serialized);
  const totalItems = await prisma.projectRequest.count({ where });
  return NextResponse.json(paginatedResponse(serialized, pagination.value, totalItems));
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidRequest('Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalidRequest('Request body must be an object');
  }

  const values = body as Record<string, unknown>;
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const email = typeof values.email === 'string' ? values.email.trim().toLowerCase() : '';
  const packageId = typeof values.packageId === 'string' ? values.packageId.trim() : '';
  const companyName = readOptionalText(values, 'companyName', 160);
  const message = readOptionalText(values, 'message', 2_000);

  if (!name || name.length > 120) return invalidRequest('Name is required and must be 120 characters or fewer');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return invalidRequest('A valid email is required');
  }
  if (!packageId) return invalidRequest('Package is required');
  if (companyName === null) return invalidRequest('Company name must be 160 characters or fewer');
  if (message === null) return invalidRequest('Message must be 2,000 characters or fewer');

  const packageRecord = await prisma.package.findFirst({
    where: { id: packageId, isActive: true },
    select: { id: true, name: true },
  });
  if (!packageRecord) return invalidRequest('Package not found or inactive');

  const projectRequest = await prisma.$transaction(async (transaction) => {
    const createdRequest = await transaction.projectRequest.create({
      data: {
        name,
        email,
        packageId,
        ...(companyName ? { companyName } : {}),
        ...(message ? { message } : {}),
      },
      select: {
        id: true,
        packageId: true,
        name: true,
        email: true,
        companyName: true,
        message: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    const staffUsers = await transaction.user.findMany({
      where: { role: 'STAFF' },
      select: { id: true },
    });

    const notificationIds: string[] = [];
    for (const staffUser of staffUsers) {
      const notificationId = await createNotification(transaction, {
        userId: staffUser.id,
        type: 'REQUEST_SUBMITTED',
        requestId: createdRequest.id,
        title: 'New project request',
        message: `${name}${companyName ? ` from ${companyName}` : ''} requested a ${packageRecord.name}.`,
      });
      if (notificationId) notificationIds.push(notificationId);
    }

    return { request: createdRequest, notificationIds };
  });

  scheduleNotificationEffects(projectRequest.notificationIds);
  scheduleEntityChanged({ entity: 'request', id: projectRequest.request.id });
  return NextResponse.json(serializeProjectRequest(projectRequest.request), { status: 201 });
}
