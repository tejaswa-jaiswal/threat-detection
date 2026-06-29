/**
 * Typed API error. Thrown by the `api` wrapper. Includes status + parsed body.
 */

import type { ApiErrorBody } from '@/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;
  readonly cause: unknown;

  constructor(status: number, body: ApiErrorBody | null, message?: string) {
    super(message ?? body?.detail ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.cause = undefined;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }
  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}