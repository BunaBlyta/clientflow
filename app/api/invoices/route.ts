import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeInvoice } from './serialize';
import { transitionInvoiceStatus } from '@/prisma/invoice-state';
import { InvoiceStatus, InvoiceType } from '@/lib/generated/prisma/enums';
import type { Prisma } from '@/lib/generated/prisma/client';
import { scheduleEntityChanged } from '@/app/api/_lib/notifications';
import { paginatedResponse, readPagination } from '@/lib/pagination';

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

  const searchParams = new URL(request.url).searchParams;
  const projectId = searchParams.get('projectId');
  const clientWhere = user.role === 'CLIENT' ? { userId: user.id } : undefined;
  const pagination = readPagination(searchParams);
  if (pagination.enabled && 'error' in pagination) return invalidRequest(pagination.error);
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status');
  const time = searchParams.get('time');
  const sort = searchParams.get('sort');
  const direction = searchParams.get('direction') === 'asc' ? 'asc' : 'desc';
  if (status && status !== 'OVERDUE' && !Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
    return invalidRequest('A valid invoice status is required');
  }
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const timeDays = time && /^\d+$/.test(time) ? Number(time) : null;
  const timeStart = timeDays && timeDays > 0 ? new Date(startOfToday.getTime() - timeDays * 86400000) : null;
  const where: Prisma.InvoiceWhereInput = {
    ...(projectId ? { projectId } : {}),
    ...(clientWhere ? { client: clientWhere } : {}),
    ...(search ? {
      OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { project: { name: { contains: search, mode: 'insensitive' } } },
        { client: { companyName: { contains: search, mode: 'insensitive' } } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ],
    } : {}),
    ...(status === 'OVERDUE'
      ? { status: { in: [InvoiceStatus.SENT, InvoiceStatus.PAYMENT_PENDING] }, dueDate: { lt: startOfToday } }
      : status
        ? { status: status as InvoiceStatus }
        : {}),
    ...(timeStart ? { createdAt: { gte: timeStart } } : {}),
  };
  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      id: true,
      projectId: true,
      clientId: true,
      project: { select: { name: true } },
      client: { select: { companyName: true, name: true } },
      type: true,
      description: true,
      amount: true,
      status: true,
      dueDate: true,
      paidAt: true,
      issuedAt: true,
      createdAt: true,
    },
    orderBy: sort === 'amount' ? { amount: direction } : sort === 'dueDate' ? { dueDate: direction } : { createdAt: direction },
    ...(pagination.enabled ? { skip: pagination.value.skip, take: pagination.value.pageSize } : {}),
  });

  const serialized = invoices.map((invoice) => ({
    ...serializeInvoice(invoice),
    ...(invoice.project ? { projectName: invoice.project.name } : {}),
    ...(invoice.client ? { clientName: invoice.client.companyName ?? invoice.client.name } : {}),
  }));
  if (!pagination.enabled) return NextResponse.json(serialized);
  const totalItems = await prisma.invoice.count({ where });
  return NextResponse.json(paginatedResponse(serialized, pagination.value, totalItems));
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
