import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { sendRejectionEmail } from '@/app/api/_lib/resend';
import { issueVerificationEmail } from '@/app/api/_lib/verification-email';
import { serializePackageSummary } from '@/app/api/packages/serialize';
import { transitionInvoiceStatus } from '@/prisma/invoice-state';
import { createNotification, scheduleEntityChanged, scheduleNotificationEffects } from '@/app/api/_lib/notifications';

export const runtime = 'nodejs';

class RequestApprovalConflict extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestApprovalConflict';
  }
}

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
    const rejectedResult = await prisma.$transaction(async (transaction) => {
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
          const notificationId = await createNotification(transaction, {
            userId: client.userId,
            type: 'REQUEST_REJECTED',
            requestId: id,
            title: 'Project request update',
            message: 'Your project request was not approved at this time.',
          });
          return { request: updatedRequest, notificationIds: notificationId ? [notificationId] : [] };
        }
      }

      return { request: updatedRequest, notificationIds: [] };
    });

    scheduleNotificationEffects(rejectedResult.notificationIds);
    scheduleEntityChanged({ entity: 'request', id });

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
      ...serializeProjectRequest(rejectedResult.request),
      emailSent,
    });
  }

  let approval;
  try {
    approval = await prisma.$transaction(async (transaction) => {
      const reviewedAt = new Date();
      const claim = await transaction.projectRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedAt },
      });

      if (claim.count !== 1) {
        const currentRequest = await transaction.projectRequest.findUnique({
          where: { id },
          select: { status: true },
        });
        throw new RequestApprovalConflict(
          currentRequest
            ? `Project request cannot transition from ${currentRequest.status} to APPROVED`
            : 'Project request not found',
        );
      }

      const existingUser = await transaction.user.findUnique({
        where: { email: projectRequest.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          client: { select: { id: true } },
        },
      });

      if (existingUser?.role === 'STAFF') {
        throw new RequestApprovalConflict('A staff account already uses this request email');
      }

      const userRecord = existingUser ?? await transaction.user.create({
        data: {
          email: projectRequest.email,
          name: projectRequest.name,
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
          name: projectRequest.name,
          email: projectRequest.email,
          ...(projectRequest.companyName ? { companyName: projectRequest.companyName } : {}),
        },
        select: { id: true },
      });

      const project = await transaction.project.create({
        data: {
          clientId: client.id,
          packageId: projectRequest.packageId,
          name: `${projectRequest.companyName ?? projectRequest.name} — ${projectRequest.package.name}`,
          status: 'PENDING',
        },
        select: { id: true },
      });

      const invoice = await transaction.invoice.create({
        data: {
          projectId: project.id,
          clientId: client.id,
          type: 'DEPOSIT',
          description: `Deposit — ${projectRequest.package.name}`,
          amount: calculateDepositAmount(projectRequest.package.price),
          currency: projectRequest.package.currency,
          status: transitionInvoiceStatus('DRAFT', 'SENT'),
          issuedAt: new Date(),
        },
        select: { id: true },
      });

      const notificationId = await createNotification(transaction, {
        userId: userRecord.id,
        type: 'REQUEST_APPROVED',
        requestId: projectRequest.id,
        projectId: project.id,
        title: 'Project request approved',
        message: 'Your project is ready. Your deposit invoice is available to pay.',
      });

      const approvedRequest = await transaction.projectRequest.update({
        where: { id },
        data: { clientId: client.id },
        select: requestSelect,
      });

      return {
        projectRequest: approvedRequest,
        user: { id: userRecord.id, email: userRecord.email, name: userRecord.name },
        projectId: project.id,
        invoiceId: invoice.id,
        notificationIds: notificationId ? [notificationId] : [],
      };
    });
  } catch (error) {
    if (error instanceof RequestApprovalConflict) {
      const status = error.message === 'Project request not found' ? 404 : 409;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }

  let emailSent = true;
  scheduleNotificationEffects(approval.notificationIds);
  scheduleEntityChanged({ entity: 'request', id, projectId: approval.projectId });
  scheduleEntityChanged({ entity: 'project', id: approval.projectId, projectId: approval.projectId });
  scheduleEntityChanged({
    entity: 'invoice',
    id: approval.invoiceId,
    projectId: approval.projectId,
    invoiceId: approval.invoiceId,
  });
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
