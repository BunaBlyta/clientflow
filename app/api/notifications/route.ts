import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import {
  DEFAULT_NOTIFICATION_PAGE_SIZE,
  LEGACY_NOTIFICATION_LIMIT,
  MAX_NOTIFICATION_PAGE_SIZE,
  notificationSelect,
  serializeNotification,
} from './_lib';

export const runtime = 'nodejs';

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function readPositiveInteger(
  value: string | null,
  fallback: number,
  label: string,
  maximum: number,
): ParseResult<number> {
  if (value === null) return { ok: true, value: fallback };
  if (!/^\d+$/.test(value)) return { ok: false, error: `${label} must be a positive integer` };

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    return { ok: false, error: `${label} must be between 1 and ${maximum}` };
  }

  return { ok: true, value: parsed };
}

function readArchiveFilter(value: string | null): ParseResult<'active' | 'archived' | 'all'> {
  const filter = value ?? 'active';
  if (filter !== 'active' && filter !== 'archived' && filter !== 'all') {
    return { ok: false, error: 'archived must be active, archived, or all' };
  }

  return { ok: true, value: filter as 'active' | 'archived' | 'all' };
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const searchParams = new URL(request.url).searchParams;
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const isPaginated = pageParam !== null || limitParam !== null;
  const pageResult = readPositiveInteger(pageParam, 1, 'page', 10_000);
  const pageSizeResult = readPositiveInteger(
    limitParam,
    DEFAULT_NOTIFICATION_PAGE_SIZE,
    'limit',
    MAX_NOTIFICATION_PAGE_SIZE,
  );
  if (!pageResult.ok) return invalidRequest(pageResult.error);
  if (!pageSizeResult.ok) return invalidRequest(pageSizeResult.error);

  const sinceValue = searchParams.get('since');
  if (sinceValue && isPaginated) {
    return invalidRequest('since cannot be combined with page or limit');
  }

  const archiveResult = readArchiveFilter(searchParams.get('archived'));
  if (!archiveResult.ok) return invalidRequest(archiveResult.error);

  const since = sinceValue ? new Date(sinceValue) : null;
  const archiveWhere =
    archiveResult.value === 'active'
      ? { archivedAt: null }
      : archiveResult.value === 'archived'
        ? { archivedAt: { not: null } }
        : {};
  const requestedLimit = isPaginated ? pageSizeResult.value : LEGACY_NOTIFICATION_LIMIT;

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}),
      ...archiveWhere,
    },
    select: notificationSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    ...(isPaginated ? { skip: (pageResult.value - 1) * requestedLimit } : {}),
    take: requestedLimit + 1,
  });

  const hasMore = notifications.length > requestedLimit;
  const serialized = notifications.slice(0, requestedLimit).map(serializeNotification);
  const headers = {
    'Cache-Control': 'no-store',
    'X-Notifications-Has-More': String(hasMore),
  };

  if (!isPaginated) return NextResponse.json(serialized, { headers });

  return NextResponse.json(
    {
      notifications: serialized,
      page: pageResult.value,
      pageSize: requestedLimit,
      hasMore,
    },
    { headers },
  );
}
