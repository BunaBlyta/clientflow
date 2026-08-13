import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeInvoice } from '@/app/api/invoices/serialize';
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

const invoiceSelect = {
  id: true,
  projectId: true,
  clientId: true,
  type: true,
  description: true,
  amount: true,
  status: true,
  dueDate: true,
  paidAt: true,
  createdAt: true,
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

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: {
      id,
      ...(user.role === 'CLIENT' ? { userId: user.id } : {}),
    },
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
      invoices: {
        select: invoiceSelect,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...serializeClient(client),
    projects: client.projects.map(serializeProject),
    invoices: client.invoices.map(serializeInvoice),
  });
}
