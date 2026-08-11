import {
  createHmac,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'clientflow_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const DEVELOPMENT_SESSION_SECRET = 'clientflow-development-session-secret';

type SessionPayload = {
  sub: string;
  exp: number;
};

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? DEVELOPMENT_SESSION_SECRET;
}

function encode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string): string {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function decodeSessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as SessionPayload;

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function verifyPassword(password: string, storedHash: string | null): boolean {
  if (!storedHash) return false;

  const [algorithm, salt, expectedHash] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHash) return false;

  try {
    const actualHash = scryptSync(password, salt, 64).toString('hex');
    const actualBuffer = Buffer.from(actualHash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    return (
      actualBuffer.length === expectedBuffer.length &&
      timingSafeEqual(actualBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}

export function getSessionToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim() || null;
  }

  return request.cookies.get(SESSION_COOKIE)?.value ?? null;
}

export async function getAuthenticatedUser(request: NextRequest) {
  const token = getSessionToken(request);
  if (!token) return null;

  const payload = decodeSessionToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  }).then((user) => (user?.isActive ? user : null));
}
