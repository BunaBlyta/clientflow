import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeStaffUser, staffUserSelect } from './_lib';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  const staffUsers = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: staffUserSelect,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(staffUsers.map(serializeStaffUser));
}
