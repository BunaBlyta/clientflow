import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeInvoice } from '@/app/api/invoices/serialize';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      ...(user.role === 'CLIENT' ? { client: { userId: user.id } } : {}),
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

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json(serializeInvoice(invoice));
}
