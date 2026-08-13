import { NextRequest } from 'next/server';
import { handleStaffInvite } from '../_invite';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handleStaffInvite(request);
}
