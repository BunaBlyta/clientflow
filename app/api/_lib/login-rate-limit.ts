import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';

const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_ACCOUNT_ATTEMPT_LIMIT = 10;
const LOGIN_IP_ATTEMPT_LIMIT = 30;

type RateLimitRow = {
  key: string;
  count: number;
  resetAt: Date;
};

export type LoginRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function blockedResult(bucket: RateLimitRow): LoginRateLimitResult {
  const retryAfterSeconds = Math.max(
    60,
    Math.ceil((new Date(bucket.resetAt).getTime() - Date.now()) / 60_000) * 60,
  );
  return { allowed: false, retryAfterSeconds };
}

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim();
  if (firstForwardedIp) return firstForwardedIp;

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function bucketKey(kind: 'account' | 'ip', identifier: string): string {
  const digest = createHash('sha256')
    .update(`login:${kind}\0${identifier}`)
    .digest('base64url');
  return `login:${kind}:${digest}`;
}

async function consumeBucket(key: string): Promise<RateLimitRow> {
  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" AS bucket ("key", "count", "resetAt", "updatedAt")
    VALUES (
      ${key},
      1,
      CURRENT_TIMESTAMP + (INTERVAL '1 second' * ${LOGIN_WINDOW_SECONDS}),
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN bucket."resetAt" <= CURRENT_TIMESTAMP THEN 1
        ELSE bucket."count" + 1
      END,
      "resetAt" = CASE
        WHEN bucket."resetAt" <= CURRENT_TIMESTAMP
          THEN CURRENT_TIMESTAMP + (INTERVAL '1 second' * ${LOGIN_WINDOW_SECONDS})
        ELSE bucket."resetAt"
      END,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "key", "count", "resetAt"
  `;

  const row = rows[0];
  if (!row) throw new Error('Unable to update login rate limit');
  return row;
}

export async function consumeLoginRateLimit(
  request: NextRequest,
  normalizedEmail: string,
): Promise<LoginRateLimitResult> {
  const accountKey = bucketKey('account', normalizedEmail);
  const ipKey = bucketKey('ip', clientIp(request));
  const ipBucket = await consumeBucket(ipKey);
  if (ipBucket.count > LOGIN_IP_ATTEMPT_LIMIT) return blockedResult(ipBucket);

  const accountBucket = await consumeBucket(accountKey);
  if (accountBucket.count > LOGIN_ACCOUNT_ATTEMPT_LIMIT) return blockedResult(accountBucket);

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function clearLoginAccountRateLimit(normalizedEmail: string): Promise<void> {
  const key = bucketKey('account', normalizedEmail);
  await prisma.$executeRaw`
    DELETE FROM "RateLimitBucket"
    WHERE "key" = ${key}
  `;
}
