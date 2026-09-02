import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import { paginatedResponse, readPagination } from '@/lib/pagination';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const pagination = readPagination(searchParams);
  if (pagination.enabled && 'error' in pagination) {
    return NextResponse.json({ error: pagination.error }, { status: 400 });
  }
  const search = searchParams.get('search')?.trim() ?? '';
  const packageId = searchParams.get('packageId');
  const sort = searchParams.get('sort');
  const direction = searchParams.get('direction') === 'desc' ? 'desc' : 'asc';
  const where: Prisma.ClientWhereInput = {
    ...(user.role === 'CLIENT' ? { userId: user.id } : {}),
    ...(search ? {
      OR: [
        { companyName: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
    ...(packageId ? { projects: { some: { packageId } } } : {}),
  };
  const [clients, paidTotals] = await Promise.all([
    prisma.client.findMany({
    where,
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      companyName: true,
      phone: true,
      createdAt: true,
      _count: { select: { projects: true } },
      projects: { select: { packageId: true, package: { select: { name: true } } } },
    },
    orderBy: sort === 'createdAt'
      ? { createdAt: direction }
      : sort
        ? { companyName: direction }
        : pagination.enabled
          ? { companyName: 'asc' }
          : { createdAt: 'desc' },
    ...(pagination.enabled ? { skip: pagination.value.skip, take: pagination.value.pageSize } : {}),
    }),
    prisma.invoice.groupBy({
      by: ['clientId'],
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
  ]);
  const paidTotalByClient = new Map(paidTotals.map((row) => [row.clientId, Number(row._sum.amount ?? 0) * 100]));

  const serialized = clients.map((client) => ({
      id: client.id,
      userId: client.userId,
      companyName: client.companyName ?? client.name,
      contactName: client.name,
      email: client.email,
      ...(client.phone ? { phone: client.phone } : {}),
      createdAt: client.createdAt.toISOString(),
      projectCount: client._count.projects,
      totalBilledCents: paidTotalByClient.get(client.id) ?? 0,
      packageTypes: Array.from(new Map(client.projects.filter((project) => project.package).map((project) => [project.packageId, { id: project.packageId!, name: project.package!.name }])).values()),
    }));

  if (!pagination.enabled) return NextResponse.json(serialized);
  const totalItems = await prisma.client.count({ where });
  return NextResponse.json(paginatedResponse(serialized, pagination.value, totalItems));
}
