import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_TOLERANCE_SECONDS = 300;

export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): boolean {
  const parts = signature.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isInteger(timestampNumber) || Math.abs(now - timestampNumber) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  return signatures.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate, 'utf8');
    return (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    );
  });
}

export function stripeSignature(payload: string, secret: string, timestamp: number): string {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

