import type { DomainError, Result } from "@/lib/core/domain/shared/result";

/**
 * Maps a domain error `code` to an HTTP status, per `doc/api-conventions.md`.
 * Codes are stable SCREAMING_SNAKE identifiers; unknowns fall back to 400 so a
 * new use case never leaks a 500 for a plain domain failure.
 */
function statusForError(error: DomainError): number {
  const { code } = error;
  // HTTP adapters surface upstream statuses as `HTTP_<status>` (see http-client).
  if (code.startsWith("HTTP_")) {
    const status = Number(code.slice("HTTP_".length));
    if (Number.isInteger(status) && status >= 400 && status <= 599)
      return status;
  }
  if (code === "NOT_FOUND" || code.endsWith("_NOT_FOUND")) return 404;
  if (code === "UNAUTHORIZED" || code.endsWith("_UNAUTHORIZED")) return 401;
  if (code === "FORBIDDEN" || code.endsWith("_FORBIDDEN")) return 403;
  if (code.endsWith("_INVALID") || code.endsWith("_VALIDATION")) return 422;
  return 400;
}

/**
 * Serializes a domain `Result<T>` as an HTTP response following the shared API
 * conventions: success returns the payload as JSON; failure returns the
 * `{ code, message }` error contract the UI renders, at the mapped status.
 */
export function respond<T>(result: Result<T>, okStatus = 200): Response {
  if (result.ok) return Response.json(result.data, { status: okStatus });
  return Response.json(result.error, { status: statusForError(result.error) });
}
