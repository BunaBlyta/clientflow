import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { sendRejectionEmail } from '@/app/api/_lib/resend';
import { issueVerificationEmail } from '@/app/api/_lib/verification-email';
import { serializePackageSummary } from '@/app/api/packages/serialize';
import { transitionInvoiceStatus } from '@/prisma/invoice-state';

export const runtime = 'nodejs';

const requestSelect = {
  id: true,
  packageId: true,
  name: true,
  email: true,
  companyName: true,
  message: true,
  status: true,
  clientId: true,
  createdAt: true,
  reviewedAt: true,
  package: {
    select: {
      name: true,
      price: true,
      currency: true,
    },
  },
} as const;

const requestDetailSelect = {
  ...requestSelect,
  client: {
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      companyName: true,
      phone: true,
      createdAt: true,
      projects: {
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
      },
    },
  },
} as const;

function calculateDepositAmount(price: { toString(): string }): string {
  const priceInCents = Math.round(Number(price.toString()) * 100);
  return (Math.round(priceInCents / 2) / 100).toFixed(2);
}

function serializeProjectRequest(projectRequest: {
  id: string;
  packageId: string;
  name: string;
  email: string;
  companyName: string | null;
  message: string | null;
  status: string;
  clientId: string | null;
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
    ...(projectRequest.clientId ? { clientId: projectRequest.clientId } : {}),
    createdAt: projectRequest.createdAt.toISOString(),
    ...(projectRequest.reviewedAt
      ? { reviewedAt: projectRequest.reviewedAt.toISOString() }
      : {}),
  };
}

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
  const projectRequest = await prisma.projectRequest.findUnique({
    where: { id },
    select: requestDetailSelect,
  });

  if (!projectRequest) {
    return NextResponse.json({ error: 'Project request not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...serializeProjectRequest(projectRequest),
    package: projectRequest.package
      ? serializePackageSummary({
          id: projectRequest.packageId,
          ...projectRequest.package,
        })
      : null,
    client: projectRequest.client ? serializeClient(projectRequest.client) : null,
    projects: projectRequest.client?.projects.map(serializeProject) ?? [],
  });
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
  if (status !== 'APPROVED' && status !== 'REJECTED') {
    return NextResponse.json(
      { error: 'Status must be APPROVED or REJECTED' },
      { status: 400 },
    );
  }

  const { id } = await params;
  const projectRequest = await prisma.projectRequest.findUnique({
    where: { id },
    select: requestSelect,
  });

  if (!projectRequest) {
    return NextResponse.json({ error: 'Project request not found' }, { status: 404 });
  }

  if (projectRequest.status !== 'PENDING') {
    return NextResponse.json(
      { error: `Project request cannot transition from ${projectRequest.status} to ${status}` },
      { status: 409 },
    );
  }

  if (!projectRequest.package) {
    return NextResponse.json(
      { error: 'A package is required before approving this request' },
      { status: 400 },
    );
  }

  if (status === 'REJECTED') {
    const rejectedRequest = await prisma.$transaction(async (transaction) => {
      const updatedRequest = await transaction.projectRequest.update({
        where: { id },
        data: { status: 'REJECTED', reviewedAt: new Date() },
        select: requestSelect,
      });

      if (projectRequest.clientId) {
        const client = await transaction.client.findUnique({
          where: { id: projectRequest.clientId },
          select: { userId: true },
        });

        if (client) {
          await transaction.notification.create({
            data: {
              userId: client.userId,
              type: 'REQUEST_REJECTED',
              requestId: id,
              title: 'Project request update',
              message: 'Your project request was not approved at this time.',
            },
          });
        }
      }

      return updatedRequest;
    });

    let emailSent = true;
    try {
      await sendRejectionEmail({
        email: projectRequest.email,
        name: projectRequest.name,
      });
    } catch (error) {
      emailSent = false;
      console.error('Failed to send rejection email after request rejection', {
        requestId: id,
        email: projectRequest.email,
        error,
      });
    }

    return NextResponse.json({
      ...serializeProjectRequest(rejectedRequest),
      emailSent,
    });
  }

  const approval = await prisma.$transaction(async (transaction) => {
    const pendingRequest = await transaction.projectRequest.findUnique({
      where: { id },
      select: requestSelect,
    });

    if (!pendingRequest) throw new Error('Project request not found');
    if (pendingRequest.status !== 'PENDING') {
      throw new Error(`Project request cannot transition from ${pendingRequest.status} to APPROVED`);
    }

    if (!pendingRequest.package) {
      throw new Error('A package is required before approving this request');
    }

    const existingUser = await transaction.user.findUnique({
      where: { email: pendingRequest.email },
      select: {
        id: true,
        email: true,
        name: true,
        client: { select: { id: true } },
      },
    });

    const userRecord = existingUser ?? await transaction.user.create({
      data: {
        email: pendingRequest.email,
        name: pendingRequest.name,
        role: 'CLIENT',
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        client: { select: { id: true } },
      },
    });

    const client = userRecord.client ?? await transaction.client.create({
      data: {
        userId: userRecord.id,
        name: pendingRequest.name,
        email: pendingRequest.email,
        ...(pendingRequest.companyName ? { companyName: pendingRequest.companyName } : {}),
      },
      select: { id: true },
    });

    const project = await transaction.project.create({
      data: {
        clientId: client.id,
        packageId: pendingRequest.packageId,
        name: `${pendingRequest.companyName ?? pendingRequest.name} — ${pendingRequest.package.name}`,
        status: 'PENDING',
      },
      select: { id: true },
    });

    await transaction.invoice.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        type: 'DEPOSIT',
        description: `Deposit — ${pendingRequest.package.name}`,
        amount: calculateDepositAmount(pendingRequest.package.price),
        currency: pendingRequest.package.currency,
        status: transitionInvoiceStatus('DRAFT', 'SENT'),
        issuedAt: new Date(),
      },
    });

    await transaction.notification.create({
      data: {
        userId: userRecord.id,
        type: 'REQUEST_APPROVED',
        requestId: pendingRequest.id,
        projectId: project.id,
        title: 'Project request approved',
        message: 'Your project is ready. Your deposit invoice is available to pay.',
      },
    });

    const approvedRequest = await transaction.projectRequest.update({
      where: { id },
      data: { status: 'APPROVED', clientId: client.id, reviewedAt: new Date() },
      select: requestSelect,
    });

    return {
      projectRequest: approvedRequest,
      user: { id: userRecord.id, email: userRecord.email, name: userRecord.name },
    };
  });

  let emailSent = true;
  try {
    await issueVerificationEmail(approval.user);
  } catch (error) {
    emailSent = false;
    console.error('Failed to send onboarding verification email after approval', {
      requestId: id,
      userId: approval.user.id,
      email: approval.user.email,
      error,
    });
  }

  return NextResponse.json({
    request: serializeProjectRequest(approval.projectRequest),
    emailSent,
  });
}
