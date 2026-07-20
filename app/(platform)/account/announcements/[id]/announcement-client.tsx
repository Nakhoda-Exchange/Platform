"use client";

import type { Announcement } from "@/lib/core/domain/account/announcement";
import { AnnouncementActionButton } from "@/components/account/announcement-action";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import { formatJalaliDay } from "@/lib/utils/jalali";

interface AnnouncementVM {
  announcement: Announcement;
  html: string; // body pre-rendered to HTML server-side (first-party markdown)
}

/**
 * Client-rendered announcement detail. Data is fetched in the browser from
 * `/api/account/announcements/[id]` (server-side BFF), which also renders the
 * markdown body to HTML so `marked` stays out of the client bundle. A missing
 * announcement is a 404 the client shows as a load error.
 */
export function AnnouncementClient({ id }: { id: string }) {
  const { data, error, loading, reload } = useClientData<AnnouncementVM>(
    `/api/account/announcements/${encodeURIComponent(id)}`,
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-4">
        <div className="h-7 w-2/3 animate-pulse rounded bg-surface" />
        <div className="h-4 w-24 animate-pulse rounded bg-surface" />
        <div className="h-40 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <LoadError
        message="بارگذاری اعلان ناموفق بود."
        action={{ label: "بازگشت به اعلان‌ها", href: "/account/announcements" }}
        onRetry={reload}
      />
    );
  }

  const a = data.announcement;

  return (
    <article className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-4">
      {a.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.image}
          alt=""
          className="mx-auto max-h-40 rounded-card object-contain"
        />
      ) : null}
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[20px] leading-8 font-extrabold text-ink">
          {a.title}
        </h1>
        <span className="text-[13px] text-muted">
          {formatJalaliDay(new Date(a.at))}
        </span>
      </header>
      <div
        className="flex flex-col gap-3 text-[15px] leading-8 text-ink [&_a]:font-bold [&_a]:text-brand [&_ol]:list-inside [&_ol]:list-decimal [&_strong]:font-extrabold [&_ul]:list-inside [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: data.html }}
      />
      {a.action ? (
        <div className="mt-auto pt-4">
          <AnnouncementActionButton action={a.action} />
        </div>
      ) : null}
    </article>
  );
}
