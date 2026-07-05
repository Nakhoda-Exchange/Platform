/**
 * Client-side announcement cache (IndexedDB, no dependency): every fetched
 * announcement is stored locally with a `readAt` stamp; the unread count is
 * simply the rows without one. Read-state is per-device by design until auth
 * sessions exist. Client-only — never import from server code.
 */

import type { AnnouncementAction } from "@/lib/core/domain/account/announcement";

/** The serializable shape that crosses the server action boundary. */
export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  at: string; // ISO
  image?: string;
  action?: AnnouncementAction;
}

interface StoredAnnouncement extends AnnouncementDto {
  readAt: string | null;
}

const DB_NAME = "nakhoda";
const STORE = "announcements";

/** Fired on window after any read-state change so badges can recount. */
export const ANNOUNCEMENTS_EVENT = "nakhoda:announcements";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function getAll(store: IDBObjectStore): Promise<StoredAnnouncement[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as StoredAnnouncement[]);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Merge freshly fetched announcements into the cache — new ones arrive
 * unread, existing ones keep their readAt — and return the unread count.
 */
export async function syncAnnouncements(
  items: AnnouncementDto[],
): Promise<number> {
  const db = await openDb();
  const store = tx(db, "readwrite");
  const existing = new Map(
    (await getAll(store)).map((a) => [a.id, a.readAt] as const),
  );
  for (const item of items) {
    store.put({ ...item, readAt: existing.get(item.id) ?? null });
  }
  const unread = items.filter((i) => !existing.get(i.id)).length;
  db.close();
  return unread;
}

/** Rows without a readAt stamp. */
export async function unreadCount(): Promise<number> {
  const db = await openDb();
  const all = await getAll(tx(db, "readonly"));
  db.close();
  return all.filter((a) => !a.readAt).length;
}

/** Visiting the announcements list marks everything read (badge clears). */
export async function markAllRead(): Promise<void> {
  const db = await openDb();
  const store = tx(db, "readwrite");
  const all = await getAll(store);
  const now = new Date().toISOString();
  for (const a of all) {
    if (!a.readAt) store.put({ ...a, readAt: now });
  }
  db.close();
  window.dispatchEvent(new Event(ANNOUNCEMENTS_EVENT));
}
