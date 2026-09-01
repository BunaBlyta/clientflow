import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeStaffUser, staffUserSelect } from '../_lib';

export const runtime = 'nodejs';

async function authorize(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  if (user.role !== 'STAFF') return { response: NextResponse.json({ error: 'Staff access required' }, { status: 403 }) };
  return { user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request);
  if (auth.response) return auth.response;
  if (auth.user.teamRole !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 }); }
  const teamRole = body && typeof body === 'object' && 'teamRole' in body ? (body as { teamRole?: unknown }).teamRole : undefined;
  if (teamRole !== 'ADMIN' && teamRole !== 'USER') return NextResponse.json({ error: 'A valid team role is required' }, { status: 400 });
  const updated = await prisma.user.updateMany({ where: { id, role: 'STAFF' }, data: { teamRole } });
  if (updated.count === 0) return NextResponse.json({ error: 'Staff user not found' }, { status: 404 });
  const staffUser = await prisma.user.findUnique({ where: { id }, select: staffUserSelect });
  return NextResponse.json(serializeStaffUser(staffUser!));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request);
  if (auth.response) return auth.response;
  if (auth.user.teamRole !== 'ADMIN') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  const { id } = await params;
  if (id === auth.user.id) return NextResponse.json({ error: 'You cannot remove your own account' }, { status: 400 });
  const removed = await prisma.user.deleteMany({ where: { id, role: 'STAFF' } });
  if (removed.count === 0) return NextResponse.json({ error: 'Staff user not found' }, { status: 404 });
  return NextResponse.json({ removed: true });
}
