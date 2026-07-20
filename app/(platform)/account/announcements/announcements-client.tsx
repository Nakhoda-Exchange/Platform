"use client";

import Link from "next/link";
import type { Announcement } from "@/lib/core/domain/account/announcement";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { MarkAnnouncementsRead } from "@/components/account/mark-announcements-read";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import { formatJalaliDay } from "@/lib/utils/jalali";

/**
 * Client-rendered announcements list. Data is fetched in the browser from
 * `/api/account/announcements` (server-side BFF).
 */
export function AnnouncementsClient() {
  const { data, error, loading, reload } = useClientData<Announcement[]>(
    "/api/account/announcements",
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-card bg-surface" />
        ))}
      </div>
    );
  }
  if (error || !data) {
    return (
      <LoadError message="بارگذاری اعلان‌ها ناموفق بود." onRetry={reload} />
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[16px] text-muted">فعلاً اعلانی ندارید.</p>
      </div>
    );
  }

  // `at` crosses the BFF as an ISO string; revive it for Jalali formatting.
  const announcements = data.map((a) => ({ ...a, at: new Date(a.at) }));

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-2">
      <MarkAnnouncementsRead />
      <ul className="flex flex-col divide-y divide-line">
        {announcements.map((a) => (
          <li key={a.id}>
            <Link
              href={`/account/announcements/${a.id}`}
              className="flex items-center justify-between gap-3 py-4 transition-colors hover:bg-surface"
            >
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-bold text-ink">
                  {a.title}
                </span>
                <span className="text-[12px] text-muted">
                  {formatJalaliDay(a.at)}
                </span>
              </span>
              <ChevronLeftIcon
                size={18}
                className="shrink-0 text-placeholder"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
