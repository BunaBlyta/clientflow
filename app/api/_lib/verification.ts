import {
  createHash,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const CODE_LENGTH = 6;
const CODE_TTL_MS = 30 * 60 * 1000;

function hashCode(code: string, salt: string): string {
  return scryptSync(code, salt, 64, {
    N: 16_384,
    r: 8,
    p: 1,
    maxmem: 32 * 1024 * 1024,
  }).toString('hex');
}

export function createVerificationCode() {
  const code = randomInt(0, 1_000_000).toString().padStart(CODE_LENGTH, '0');
  const salt = randomBytes(16).toString('hex');

  return {
    code,
    hash: `scrypt:${salt}:${hashCode(code, salt)}`,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  };
}

export function verifyCode(code: string, storedHash: string | null): boolean {
  if (!storedHash) return false;

  const [algorithm, salt, expectedHash] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHash) return false;

  try {
    const actualHash = hashCode(code, salt);
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

export function codeDigest(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}
