import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializePackageSummary } from '@/app/api/packages/serialize';
import { ProjectStatus } from '@/lib/generated/prisma/enums';
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
  const status = searchParams.get('status');
  const packageId = searchParams.get('packageId');
  const sort = searchParams.get('sort');
  const direction = searchParams.get('direction') === 'asc' ? 'asc' : 'desc';
  if (status && !Object.values(ProjectStatus).includes(status as ProjectStatus)) {
    return NextResponse.json({ error: 'A valid project status is required' }, { status: 400 });
  }

  const where: Prisma.ProjectWhereInput = {
    ...(user.role === 'CLIENT' ? { client: { userId: user.id } } : {}),
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(status ? { status: status as ProjectStatus } : {}),
    ...(packageId ? { packageId } : {}),
  };
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
    orderBy: sort === 'name' ? { name: direction } : sort === 'status' ? { status: direction } : { updatedAt: direction },
    ...(pagination.enabled ? { skip: pagination.value.skip, take: pagination.value.pageSize } : {}),
  });

  const serialized = projects.map((project) => ({
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
    }));

  if (!pagination.enabled) return NextResponse.json(serialized);
  const totalItems = await prisma.project.count({ where });
  return NextResponse.json(paginatedResponse(serialized, pagination.value, totalItems));
}
