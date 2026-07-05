import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { AnnouncementActionButton } from "@/components/account/announcement-action";
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

  // Bodies are markdown (or plain HTML) authored by the platform itself —
  // first-party trusted content, rendered server-side. If announcements ever
  // accept third-party input, add sanitization here.
  const html = await marked.parse(a.body);

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
        <span className="text-[13px] text-muted">{formatJalaliDay(a.at)}</span>
      </header>
      <div
        className="flex flex-col gap-3 text-[15px] leading-8 text-ink [&_a]:font-bold [&_a]:text-brand [&_ol]:list-inside [&_ol]:list-decimal [&_strong]:font-extrabold [&_ul]:list-inside [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {a.action ? (
        <div className="mt-auto pt-4">
          <AnnouncementActionButton action={a.action} />
        </div>
      ) : null}
    </article>
  );
}
