import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializePackageSummary } from '@/app/api/packages/serialize';

export const runtime = 'nodejs';

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

function serializeClient(client: {
  id: string;
  userId: string;
  name: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  createdAt: Date;
}) {
  return {
    id: client.id,
    userId: client.userId,
    companyName: client.companyName ?? client.name,
    contactName: client.name,
    email: client.email,
    ...(client.phone ? { phone: client.phone } : {}),
    createdAt: client.createdAt.toISOString(),
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

  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.contactLead.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      message: true,
      createdAt: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: 'Custom inquiry not found' }, { status: 404 });
  }

  const client = await prisma.client.findFirst({
    where: { email: lead.email },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      companyName: true,
      phone: true,
      createdAt: true,
      projects: {
        select: projectSelect,
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  return NextResponse.json({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    client: client ? serializeClient(client) : null,
    projects: client?.projects.map(serializeProject) ?? [],
  });
}
