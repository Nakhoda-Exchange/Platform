"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { ChevronRightIcon, HeadphonesIcon } from "@/components/ui/icons";
import { HEADER_CONFIG } from "./platform-nav";
import { openSupportChat } from "@/components/support/goftino";

/**
 * Platform app bar. Per-route (via HEADER_CONFIG): the home tab shows the logo,
 * section screens show a title, and nested screens show a back button + title.
 * Trailing quick action (support) is always tappable. Sticky, RTL, safe-area
 * aware. Distinct from the marketing landing header (`site-header`).
 */
export function PlatformHeader() {
  const pathname = usePathname();
  const cfg = HEADER_CONFIG[pathname] ?? {};
  const showTitle = Boolean(cfg.title || cfg.backHref);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <div className="flex items-center gap-1">
        {cfg.backHref ? (
          <Link
            href={cfg.backHref}
            aria-label="بازگشت"
            className="flex size-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface"
          >
            <ChevronRightIcon size={24} />
          </Link>
        ) : null}
        {showTitle ? (
          <h1 className="text-[18px] font-extrabold text-ink">{cfg.title}</h1>
        ) : (
          <Logo size={20} href="/market" />
        )}
      </div>

      <button
        type="button"
        onClick={openSupportChat}
        aria-label="پشتیبانی"
        className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-surface text-gray-500 transition-colors hover:bg-gray-100"
      >
        <HeadphonesIcon size={20} />
      </button>
    </header>
  );
}
