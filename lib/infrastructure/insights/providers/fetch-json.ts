import { fail, ok, type Result } from "@/lib/core/domain/shared/result";

/**
 * Minimal server-side JSON fetch for external providers. Distinct from the
 * backend `HttpClient` (which is baseUrl-bound): providers call arbitrary
 * hosts. Timeout-guarded, rate-limit aware, and `cache: "no-store"` because the
 * per-capability TTL cache (../cache.ts) owns caching. Server-only — provider
 * keys travel in headers here and never reach the client bundle.
 */

const DEFAULT_TIMEOUT_MS = 8_000;

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Result<T>> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    return fail("PROVIDER_NETWORK", "ارتباط با ارائه‌دهنده داده برقرار نشد.");
  }
  if (res.status === 429) {
    return fail("PROVIDER_RATE_LIMIT", "محدودیت نرخ ارائه‌دهنده داده.");
  }
  if (!res.ok) {
    return fail(`PROVIDER_HTTP_${res.status}`, "ارائه‌دهنده داده پاسخ نداد.");
  }
  try {
    return ok((await res.json()) as T);
  } catch {
    return fail("PROVIDER_BAD_JSON", "پاسخ ارائه‌دهنده قابل خواندن نبود.");
  }
}
