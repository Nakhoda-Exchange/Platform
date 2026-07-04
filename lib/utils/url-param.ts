/**
 * Write a query param into the address bar WITHOUT a Next navigation —
 * history.replaceState keeps the RSC tree untouched (no refetch per
 * keystroke) while making the state shareable/restorable.
 */
export function replaceUrlParam(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(null, "", url);
}
