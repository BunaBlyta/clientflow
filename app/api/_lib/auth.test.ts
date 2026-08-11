import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { createSessionToken, decodeSessionToken } from './auth';

describe('session token signing', () => {
  it('rejects a token decoded with a different secret', () => {
    const token = createSessionToken('staff-1');

    expect(decodeSessionToken(token, 'wrong-secret')).toBeNull();
  });
});
