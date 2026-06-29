import { describe, it, expect } from 'vitest';
import { SignJWT } from 'jose';
import { decode, expiresAt, isExpired, msUntilExpiry } from './jwt';

const secret = new TextEncoder().encode('test-secret-do-not-use-in-prod');

async function mint(expSecondsFromNow: number, sub = '42'): Promise<string> {
  return await new SignJWT({ sub, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expSecondsFromNow)
    .sign(secret);
}

describe('jwt utils', () => {
  it('decodes a valid token', async () => {
    const tok = await mint(60);
    const d = decode(tok);
    expect(d).not.toBeNull();
    expect(d!.sub).toBe('42');
    expect(d!.role).toBe('admin');
    expect(typeof d!.exp).toBe('number');
  });

  it('returns null for garbage', () => {
    expect(decode('not-a-token')).toBeNull();
    expect(decode('')).toBeNull();
    // @ts-expect-error: pass null to exercise runtime behaviour
    expect(decode(null)).toBeNull();
  });

  it('reports expiry in ms', async () => {
    const tok = await mint(60);
    const exp = expiresAt(tok);
    expect(exp).not.toBeNull();
    // ±5s tolerance for test wall-clock drift.
    expect(Math.abs((exp as number) - Date.now() - 60_000)).toBeLessThan(5_000);
  });

  it('detects expired tokens', async () => {
    const expired = await mint(-10);
    expect(isExpired(expired)).toBe(true);
  });

  it('detects tokens that expire within leeway', async () => {
    const soon = await mint(2);
    expect(isExpired(soon, 5)).toBe(true);
    expect(isExpired(soon, 0)).toBe(false);
  });

  it('computes ms until expiry', async () => {
    const tok = await mint(120);
    const ms = msUntilExpiry(tok);
    expect(ms).toBeGreaterThan(115_000);
    expect(ms).toBeLessThan(125_000);
  });

  it('returns 0 for already-expired tokens', async () => {
    const tok = await mint(-100);
    expect(msUntilExpiry(tok)).toBe(0);
  });
});