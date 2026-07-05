/**
 * Favorites / watchlist (issue #68). Per-device (localStorage) until auth
 * sessions exist — same policy as announcements read-state. Client-only.
 */

const STORAGE_KEY = "favorites";

/** Fired on window after any change so open lists can re-render. */
export const FAVORITES_EVENT = "nakhoda:favorites";

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function isFavorite(coinId: string): boolean {
  return getFavorites().has(coinId);
}

/** Toggle a coin; returns the new state. */
export function toggleFavorite(coinId: string): boolean {
  const favorites = getFavorites();
  const nowFavorite = !favorites.has(coinId);
  if (nowFavorite) favorites.add(coinId);
  else favorites.delete(coinId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    /* storage unavailable — the toggle still applies for this render */
  }
  window.dispatchEvent(new Event(FAVORITES_EVENT));
  return nowFavorite;
}
