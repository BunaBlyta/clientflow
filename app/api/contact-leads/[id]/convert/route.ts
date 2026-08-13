import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { issueVerificationEmail } from '@/app/api/_lib/verification-email';
import { serializeInvoice } from '@/app/api/invoices/serialize';
import { transitionInvoiceStatus } from '@/prisma/invoice-state';

export const runtime = 'nodejs';

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function readAmount(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const raw = typeof value === 'string' ? value.trim() : String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99) return null;
  return amount.toFixed(2);
}

function readOptionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : text.length === 0 ? undefined : null;
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

function serializeProject(project: {
  id: string;
  clientId: string;
  packageId: string | null;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: project.id,
    clientId: project.clientId,
    packageId: project.packageId,
    package: null,
    name: project.name,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

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
  const projectName = typeof values.projectName === 'string' ? values.projectName.trim() : '';
  const companyName = readOptionalText(values.companyName, 160);
  const description = readOptionalText(values.description, 2_000);
  const invoiceDescription = readOptionalText(values.invoiceDescription, 2_000);
  const amount = readAmount(values.amount);
  const currency = typeof values.currency === 'string' ? values.currency.trim().toLowerCase() : '';
  const sendInvoice = values.sendInvoice === true;
  const dueDateValue = values.dueDate;
  const dueDate = dueDateValue === undefined || dueDateValue === '' ? undefined : new Date(String(dueDateValue));

  if (!projectName || projectName.length > 160) {
    return invalidRequest('Project name is required and must be 160 characters or fewer');
  }
  if (companyName === null) return invalidRequest('Company name must be 160 characters or fewer');
  if (description === null) return invalidRequest('Description must be 2,000 characters or fewer');
  if (invoiceDescription === null) return invalidRequest('Invoice description must be 2,000 characters or fewer');
  if (!amount) return invalidRequest('Amount must be a positive value with at most two decimals');
  if (!/^[a-z]{3}$/.test(currency)) return invalidRequest('Currency must be a three-letter code');
  if (dueDate && Number.isNaN(dueDate.getTime())) return invalidRequest('Due date must be a valid date');

  const { id } = await params;
  let conversion;
  try {
    conversion = await prisma.$transaction(async (transaction) => {
      const lead = await transaction.contactLead.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, message: true },
      });
      if (!lead) return null;

      const existingUser = await transaction.user.findUnique({
        where: { email: lead.email },
        select: {
          id: true,
          role: true,
          isActive: true,
          client: {
            select: {
              id: true,
              userId: true,
              name: true,
              email: true,
              companyName: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      });

      if (existingUser?.role === 'STAFF') {
        return { conflict: 'A staff account already uses this inquiry email' } as const;
      }

      let client = existingUser?.client ?? null;
      let shouldInvite = false;
      if (!client) {
        const clientUser = existingUser ?? await transaction.user.create({
          data: { email: lead.email, name: lead.name, role: 'CLIENT', isActive: false },
          select: { id: true },
        });
        client = await transaction.client.create({
          data: {
            userId: clientUser.id,
            name: lead.name,
            email: lead.email,
            ...(companyName ? { companyName } : {}),
          },
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
            createdAt: true,
          },
        });
        shouldInvite = !existingUser || !existingUser.isActive;
      }

      const project = await transaction.project.create({
        data: {
          clientId: client.id,
          name: projectName,
          ...(description ? { description } : {}),
          status: 'PENDING',
        },
        select: {
          id: true,
          clientId: true,
          packageId: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      const invoice = await transaction.invoice.create({
        data: {
          projectId: project.id,
          clientId: client.id,
          type: 'CUSTOM',
          amount,
          currency,
          description: invoiceDescription ?? 'Custom project invoice',
          status: sendInvoice ? transitionInvoiceStatus('DRAFT', 'SENT') : 'DRAFT',
          ...(sendInvoice ? { issuedAt: new Date() } : {}),
          ...(dueDate ? { dueDate } : {}),
        },
        select: {
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
        },
      });

      if (sendInvoice) {
        await transaction.notification.create({
          data: {
            userId: (existingUser?.id ?? client.userId),
            type: 'INVOICE_ISSUED',
            invoiceId: invoice.id,
            projectId: invoice.projectId,
            title: 'Invoice issued',
            message: `${invoice.description ?? 'A custom invoice'} is ready to review and pay.`,
          },
        });
      }

      return { lead, client, project, invoice, shouldInvite };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'A client with this email was created already' }, { status: 409 });
    }
    throw error;
  }

  if (!conversion) return NextResponse.json({ error: 'Custom inquiry not found' }, { status: 404 });
  if ('conflict' in conversion) return NextResponse.json({ error: conversion.conflict }, { status: 409 });

  let emailSent = true;
  if (conversion.shouldInvite) {
    try {
      await issueVerificationEmail({
        id: conversion.client.userId,
        email: conversion.client.email,
        name: conversion.client.name,
      });
    } catch (error) {
      emailSent = false;
      console.error('Failed to send custom client invitation email after conversion', {
        leadId: conversion.lead.id,
        clientId: conversion.client.id,
        email: conversion.client.email,
        error,
      });
    }
  }

  return NextResponse.json({
    lead: conversion.lead,
    client: serializeClient(conversion.client),
    project: serializeProject(conversion.project),
    invoice: serializeInvoice(conversion.invoice),
    emailSent: conversion.shouldInvite ? emailSent : null,
  }, { status: 201 });
}
