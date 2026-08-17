import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { createNotification, scheduleEntityChanged, scheduleNotificationEffects } from '@/app/api/_lib/notifications';

export const runtime = 'nodejs';

const contactLeadSelect = {
  id: true,
  name: true,
  email: true,
  message: true,
  createdAt: true,
} as const;

function serializeContactLead(lead: {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
}, clientId?: string) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    message: lead.message,
    createdAt: lead.createdAt.toISOString(),
    ...(clientId ? { clientId } : {}),
  };
}

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const leads = await prisma.contactLead.findMany({
    select: contactLeadSelect,
    orderBy: { createdAt: 'desc' },
  });
  const emails = [...new Set(leads.map((lead) => lead.email))];
  const clients = emails.length
    ? await prisma.client.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true },
      })
    : [];
  const clientIds = new Map(clients.map((client) => [client.email, client.id]));

  return NextResponse.json(leads.map((lead) => serializeContactLead(lead, clientIds.get(lead.email))));
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
  const message = typeof values.message === 'string' ? values.message.trim() : '';

  if (!name || name.length > 120) {
    return invalidRequest('Name is required and must be 120 characters or fewer');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return invalidRequest('A valid email is required');
  }
  if (!message || message.length > 2_000) {
    return invalidRequest('Message is required and must be 2,000 characters or fewer');
  }

  const result = await prisma.$transaction(async (transaction) => {
    const createdLead = await transaction.contactLead.create({
      data: { name, email, message },
      select: contactLeadSelect,
    });

    const staffUsers = await transaction.user.findMany({
      where: { role: 'STAFF', isActive: true },
      select: { id: true },
    });
    const notificationIds: string[] = [];
    for (const staffUser of staffUsers) {
      const notificationId = await createNotification(transaction, {
        userId: staffUser.id,
        type: 'REQUEST_SUBMITTED',
        title: 'New custom inquiry',
        message: `${name} sent a custom package inquiry.`,
      });
      if (notificationId) notificationIds.push(notificationId);
    }

    return { lead: createdLead, notificationIds };
  });

  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({ entity: 'request', id: result.lead.id });
  return NextResponse.json(serializeContactLead(result.lead), { status: 201 });
}
