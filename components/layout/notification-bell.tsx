"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAnnouncements } from "@/app/actions/account";
import {
  ANNOUNCEMENTS_EVENT,
  syncAnnouncements,
  unreadCount,
} from "@/lib/utils/announcements-db";
import { BellIcon } from "@/components/ui/icons";
import { toPersianDigits } from "@/lib/utils/digits";

/**
 * Header bell → /account/announcements, with an unread badge. On mount it
 * pulls announcements from the backend, merges them into the IndexedDB cache
 * (new ones arrive unread) and counts; it recounts when the list page marks
 * everything read (ANNOUNCEMENTS_EVENT).
 */
export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const recount = () =>
      unreadCount()
        .then((n) => alive && setCount(n))
        .catch(() => {});
    fetchAnnouncements()
      .then((items) => syncAnnouncements(items))
      .then(() => recount())
      .catch(() => {}); // offline/IDB-unavailable → just no badge
    window.addEventListener(ANNOUNCEMENTS_EVENT, recount);
    return () => {
      alive = false;
      window.removeEventListener(ANNOUNCEMENTS_EVENT, recount);
    };
  }, []);

  return (
    <Link
      href="/account/announcements"
      aria-label={
        count > 0
          ? `اعلان‌ها، ${toPersianDigits(count)} خوانده‌نشده`
          : "اعلان‌ها"
      }
      className="relative flex size-11 items-center justify-center rounded-xl bg-surface text-muted transition-colors hover:bg-line"
    >
      <BellIcon size={20} />
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white"
        >
          {toPersianDigits(Math.min(count, 99))}
        </span>
      ) : null}
    </Link>
  );
}
