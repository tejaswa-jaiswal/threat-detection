/**
 * JWT decode helpers.
 *
 * We intentionally DO NOT verify the signature — the server is the source of
 * truth, and we only need to read `exp` so we can auto-logout the UI before
 * the next request fails with 401.
 */
import { decodeJwt } from 'jose';

export interface DecodedToken {
  sub: string;
  role?: string;
  exp: number; // seconds since epoch
  iat?: number;
}

export function decode(token: string): DecodedToken | null {
  try {
    const payload = decodeJwt(token);
    if (typeof payload.exp !== 'number' || typeof payload.sub !== 'string') return null;
    return payload as DecodedToken;
  } catch {
    return null;
  }
}

export function expiresAt(token: string): number | null {
  return decode(token)?.exp ? decode(token)!.exp * 1000 : null;
}

export function isExpired(token: string, leewaySec = 5): boolean {
  const exp = decode(token)?.exp;
  if (!exp) return true;
  return Date.now() >= (exp - leewaySec) * 1000;
}

export function msUntilExpiry(token: string): number {
  const exp = decode(token)?.exp;
  if (!exp) return 0;
  return exp * 1000 - Date.now();
}