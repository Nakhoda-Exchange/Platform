import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { formatJalaliDay } from "@/lib/utils/jalali";

export const metadata: Metadata = {
  title: "اعلان‌ها | ناخدا",
};

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await container
    .resolve(TOKENS.ListAnnouncementsUseCase)
    .byId(id);

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری اعلان ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }
  if (!result.data) notFound();
  const a = result.data;

  return (
    <article className="flex flex-1 flex-col gap-4 px-4 pb-8 pt-4">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[20px] leading-8 font-extrabold text-ink">
          {a.title}
        </h1>
        <span className="text-[13px] text-muted">{formatJalaliDay(a.at)}</span>
      </header>
      {a.body.split("\n\n").map((paragraph, i) => (
        <p key={i} className="text-[15px] leading-8 text-ink">
          {paragraph}
        </p>
      ))}
    </article>
  );
}
