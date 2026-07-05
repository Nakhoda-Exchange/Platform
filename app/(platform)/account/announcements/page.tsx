import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { formatJalaliDay } from "@/lib/utils/jalali";

export const metadata: Metadata = {
  title: "اعلان‌ها | ناخدا",
};

export default async function AnnouncementsPage() {
  const result = await container
    .resolve(TOKENS.ListAnnouncementsUseCase)
    .execute();

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری اعلان‌ها ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  if (result.data.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[16px] text-muted">فعلاً اعلانی ندارید.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-2">
      <ul className="flex flex-col divide-y divide-line">
        {result.data.map((a) => (
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
