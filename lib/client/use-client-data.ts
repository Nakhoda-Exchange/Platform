"use client";

import { useCallback, useEffect, useState } from "react";

/** Result of a client-side load: the data, a user-showable Persian error, and
 *  the in-flight flag. `reload` re-runs the request (wired to retry buttons). */
export interface ClientData<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Client-side data fetching for the CSR app: reads a same-origin BFF route
 * handler (`/api/…`) that runs server-side, forwards the httpOnly auth token,
 * and proxies the backend. Keeping the fetch behind that route is what lets the
 * app render on the client without exposing `API_BASE_URL` or the token to the
 * browser (see the SPA guide in node_modules/next/dist/docs — "SPAs with SWR";
 * this is the hand-rolled equivalent, no extra dependency).
 *
 * Error bodies follow the `{ code, message }` contract (lib/utils/api-response),
 * so `message` is already a Persian, showable string.
 */
export function useClientData<T>(url: string): ClientData<T> {
  // `reload` bumps the nonce; `key` (url + nonce) identifies the current
  // request. `loading` is derived — true whenever the stored result predates
  // the current key — so the effect never calls setState synchronously, and a
  // late response for a stale key is ignored (no flash of old data).
  const [nonce, setNonce] = useState(0);
  const key = `${url}#${nonce}`;
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  }>({ key: "", data: null, error: null });

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(body.message ?? "خطایی رخ داد. دوباره تلاش کنید.");
        }
        return (await res.json()) as T;
      })
      .then((data) => setResult({ key, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          data: null,
          error:
            err instanceof Error
              ? err.message
              : "خطایی رخ داد. دوباره تلاش کنید.",
        });
      });

    return () => controller.abort();
  }, [url, key]);

  const loading = result.key !== key;
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload,
  };
}
