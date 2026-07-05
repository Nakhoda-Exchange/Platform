"use client";

import { useEffect } from "react";
import { fetchAnnouncements } from "@/app/actions/account";
import { markAllRead, syncAnnouncements } from "@/lib/utils/announcements-db";

/**
 * Visiting the announcements list marks everything read: sync the latest
 * into the IndexedDB cache first (so new items exist to be marked), then
 * stamp readAt — the header badge recounts via ANNOUNCEMENTS_EVENT.
 */
export function MarkAnnouncementsRead() {
  useEffect(() => {
    fetchAnnouncements()
      .then((items) => syncAnnouncements(items))
      .then(() => markAllRead())
      .catch(() => {});
  }, []);
  return null;
}
