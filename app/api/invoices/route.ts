import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeInvoice } from './serialize';
import { transitionInvoiceStatus } from '@/prisma/invoice-state';
import { InvoiceType } from '@/lib/generated/prisma/enums';
import { scheduleEntityChanged } from '@/app/api/_lib/notifications';

export const runtime = 'nodejs';

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
  issuedAt: true,
  createdAt: true,
} as const;

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function readAmount(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;

  const raw = typeof value === 'string' ? value.trim() : String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null;

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99) return null;

  return amount.toFixed(2);
}

function readDueDate(value: unknown): Date | null | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return null;

  const dueDate = new Date(value);
  return Number.isNaN(dueDate.getTime()) ? null : dueDate;
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get('projectId');
  const clientWhere = user.role === 'CLIENT' ? { userId: user.id } : undefined;
  const invoices = await prisma.invoice.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(clientWhere ? { client: clientWhere } : {}),
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
      issuedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invoices.map(serializeInvoice));
}

export async function POST(request: NextRequest) {
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
    return invalidRequest('Request body must be valid JSON');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return invalidRequest('Request body must be an object');
  }

  const values = body as Record<string, unknown>;
  const projectId = typeof values.projectId === 'string' ? values.projectId.trim() : '';
  const type = typeof values.type === 'string' ? values.type.trim() : '';
  const currency = typeof values.currency === 'string' ? values.currency.trim().toLowerCase() : '';
  const description = values.description === undefined || values.description === null
    ? undefined
    : typeof values.description === 'string'
      ? values.description.trim()
      : null;
  const amount = readAmount(values.amount);
  const dueDate = readDueDate(values.dueDate);

  if (!projectId) return invalidRequest('Project is required');
  if (!(Object.values(InvoiceType) as string[]).includes(type)) {
    return invalidRequest('A valid invoice type is required');
  }
  if (values.status !== undefined && values.status !== 'DRAFT') {
    return invalidRequest('New invoices must start in DRAFT');
  }
  if (!amount) return invalidRequest('Amount must be a positive value with at most two decimals');
  if (!/^[a-z]{3}$/.test(currency)) return invalidRequest('Currency must be a three-letter code');
  if (description === null || (description !== undefined && description.length > 2_000)) {
    return invalidRequest('Description must be 2,000 characters or fewer');
  }
  if (dueDate === null) return invalidRequest('Due date must be a valid date');

  const createdInvoice = await prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, name: true },
    });

    if (!project) return null;

    const client = await transaction.client.findUnique({
      where: { id: project.clientId },
      select: { userId: true },
    });

    if (!client) return null;

    const invoice = await transaction.invoice.create({
      data: {
        projectId: project.id,
        clientId: project.clientId,
        type: type as (typeof InvoiceType)[keyof typeof InvoiceType],
        amount,
        currency,
        status: transitionInvoiceStatus('DRAFT', 'DRAFT'),
        ...(description ? { description } : {}),
        ...(dueDate ? { dueDate } : {}),
      },
      select: invoiceSelect,
    });

    return invoice;
  });

  if (!createdInvoice) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  scheduleEntityChanged({ entity: 'invoice', id: createdInvoice.id, projectId: createdInvoice.projectId, invoiceId: createdInvoice.id });

  return NextResponse.json(serializeInvoice(createdInvoice), { status: 201 });
}
