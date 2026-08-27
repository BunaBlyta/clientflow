import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

const NAME_MAX_LENGTH = 120;
const COMPANY_MAX_LENGTH = 120;
const PHONE_MAX_LENGTH = 40;

type ClientProfile = { id: string; companyName: string | null; phone: string | null };

function serializeMe(
  user: { id: string; name: string; email: string; role: string },
  client: ClientProfile | null,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(client
      ? {
          clientId: client.id,
          companyName: client.companyName,
          phone: client.phone,
        }
      : {}),
  };
}

function loadClientProfile(userId: string) {
  return prisma.client.findUnique({
    where: { userId },
    select: { id: true, companyName: true, phone: true },
  });
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return new Response(null, { status: 401 });

  const client = user.role === 'CLIENT' ? await loadClientProfile(user.id) : null;
  return NextResponse.json(serializeMe(user, client));
}

// Lets a signed-in user edit their own display name and, for client accounts,
// their company name and phone. Email is deliberately not editable here — it is
// the login identity and changing it would need a re-verification flow.
export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return new Response(null, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const hasName = 'name' in record;
  const hasCompany = 'companyName' in record;
  const hasPhone = 'phone' in record;

  if (!hasName && !hasCompany && !hasPhone) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  // Optional-string fields: absent means "leave unchanged"; an empty string on
  // companyName / phone means "clear it".
  let name: string | undefined;
  if (hasName) {
    if (typeof record.name !== 'string' || !record.name.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    name = record.name.trim();
    if (name.length > NAME_MAX_LENGTH) {
      return NextResponse.json({ error: 'Name is too long' }, { status: 400 });
    }
  }

  let companyName: string | null | undefined;
  if (hasCompany) {
    if (record.companyName !== null && typeof record.companyName !== 'string') {
      return NextResponse.json({ error: 'Company name must be text' }, { status: 400 });
    }
    const trimmed = typeof record.companyName === 'string' ? record.companyName.trim() : '';
    if (trimmed.length > COMPANY_MAX_LENGTH) {
      return NextResponse.json({ error: 'Company name is too long' }, { status: 400 });
    }
    companyName = trimmed ? trimmed : null;
  }

  let phone: string | null | undefined;
  if (hasPhone) {
    if (record.phone !== null && typeof record.phone !== 'string') {
      return NextResponse.json({ error: 'Phone must be text' }, { status: 400 });
    }
    const trimmed = typeof record.phone === 'string' ? record.phone.trim() : '';
    if (trimmed.length > PHONE_MAX_LENGTH) {
      return NextResponse.json({ error: 'Phone number is too long' }, { status: 400 });
    }
    phone = trimmed ? trimmed : null;
  }

  const isClient = user.role === 'CLIENT';
  if ((hasCompany || hasPhone) && !isClient) {
    return NextResponse.json(
      { error: 'Only client accounts have a company name or phone number' },
      { status: 400 },
    );
  }

  if (name !== undefined) {
    await prisma.user.update({ where: { id: user.id }, data: { name } });
  }

  if (isClient) {
    const clientData: { name?: string; companyName?: string | null; phone?: string | null } = {};
    // Keep the client row's own name column in step with the user's name so
    // staff-facing views (which read Client.name) don't drift.
    if (name !== undefined) clientData.name = name;
    if (companyName !== undefined) clientData.companyName = companyName;
    if (phone !== undefined) clientData.phone = phone;
    if (Object.keys(clientData).length > 0) {
      await prisma.client.update({ where: { userId: user.id }, data: clientData });
    }
  }

  const client = isClient ? await loadClientProfile(user.id) : null;
  return NextResponse.json(
    serializeMe({ ...user, name: name ?? user.name }, client),
  );
}
