"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import {
  BellIcon,
  ChevronRightIcon,
  HeadphonesIcon,
} from "@/components/ui/icons";
import { HEADER_CONFIG, type HeaderConfig } from "./platform-nav";
import { openSupportChat } from "@/components/support/goftino";

/**
 * Header config for a route. Static sub-pages live in HEADER_CONFIG; dynamic
 * ones (the coin detail page) are matched by pattern here so every nested
 * screen gets a back button without hardcoding each coin.
 */
function headerConfigFor(pathname: string): HeaderConfig {
  if (HEADER_CONFIG[pathname]) return HEADER_CONFIG[pathname];
  if (/^\/market\/.+/.test(pathname)) {
    return { title: "جزئیات رمزارز", backHref: "/market" };
  }
  if (/^\/account\/announcements\/.+/.test(pathname)) {
    return { title: "اعلان‌ها", backHref: "/account/announcements" };
  }
  const trade = pathname.match(/^\/trade\/([^/]+)/);
  if (trade) {
    return { title: "معامله", backHref: `/market/${trade[1]}` };
  }
  return {};
}

/**
 * Platform app bar. Per-route (via HEADER_CONFIG): the home tab shows the logo,
 * section screens show a title, and nested screens show a back button + title.
 * Trailing quick action (support) is always tappable. Sticky, RTL, safe-area
 * aware. Distinct from the marketing landing header (`site-header`).
 */
export function PlatformHeader() {
  const pathname = usePathname();
  const cfg = headerConfigFor(pathname);
  const showTitle = Boolean(cfg.title || cfg.backHref);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
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

      <div className="flex items-center gap-2">
        <Link
          href="/account/announcements"
          aria-label="اعلان‌ها"
          className="flex size-11 items-center justify-center rounded-xl bg-surface text-muted transition-colors hover:bg-line"
        >
          <BellIcon size={20} />
        </Link>
        <button
          type="button"
          onClick={openSupportChat}
          aria-label="پشتیبانی"
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-surface text-muted transition-colors hover:bg-line"
        >
          <HeadphonesIcon size={20} />
        </button>
      </div>
    </header>
  );
}
