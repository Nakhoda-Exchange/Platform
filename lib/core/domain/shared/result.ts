/**
 * Domain-level Result envelope. Every use case and port returns one of these
 * so the presentation layer handles success/failure uniformly, independent of
 * any transport or framework.
 */
export type Result<T> =
  { ok: true; data: T } | { ok: false; error: DomainError };

export interface DomainError {
  code: string;
  message: string;
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: string, message: string): Result<T> {
  return { ok: false, error: { code, message } };
}
