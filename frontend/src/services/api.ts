/**
 * Fetch wrapper used by all services.
 *
 * - Attaches `Authorization: Bearer <token>` when a token is provided.
 * - Throws `ApiError` on non-2xx with the parsed JSON body if available.
 * - Triggers an auth-logout callback on 401 (wired in `authStore`).
 */
import { config } from '@/constants/config';
import { ApiError } from '@/utils/errors';

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Optional token override; when omitted the wrapper reads the global token. */
  token?: string | null;
  /** JSON body — serialised and content-type set automatically. */
  json?: unknown;
  /** When true, return the raw Response (for streaming or blob downloads). */
  raw?: boolean;
}

export interface InternalTokenProvider {
  (): string | null;
}

let tokenProvider: InternalTokenProvider = () => null;

export function setTokenProvider(provider: InternalTokenProvider): void {
  tokenProvider = provider;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { token, json, raw, headers, ...rest } = opts;

  const finalHeaders = new Headers(headers);
  const t = token !== undefined ? token : tokenProvider();
  if (t) finalHeaders.set('Authorization', `Bearer ${t}`);

  let body: BodyInit | undefined;
  if (json !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  const url = path.startsWith('http') ? path : `${config.apiUrl}${path}`;
  const res = await fetch(url, { ...rest, headers: finalHeaders, body });

  if (raw) return res as unknown as T;

  // 204 No Content / empty body — return undefined cast.
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON body — keep raw text for caller to inspect.
      parsed = { detail: text };
    }
  }

  if (!res.ok) {
    const errBody =
      parsed && typeof parsed === 'object' ? (parsed as { detail?: string }) : null;
    const err = new ApiError(
      res.status,
      errBody ? { detail: errBody.detail ?? `HTTP ${res.status}` } : null,
    );
    if (err.isUnauthorized && onUnauthorized) onUnauthorized();
    throw err;
  }

  return parsed as T;
}

export const api = {
  get: <T,>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T,>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST' }),
  put: <T,>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: 'PUT' }),
  patch: <T,>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'PATCH' }),
  delete: <T,>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};