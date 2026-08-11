import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeInvoice } from './serialize';

export const runtime = 'nodejs';

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
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invoices.map(serializeInvoice));
}
