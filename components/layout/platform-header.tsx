"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { HeaderBar } from "./header-bar";
import { ChevronRightIcon, HeadphonesIcon } from "@/components/ui/icons";
import { NotificationBell } from "./notification-bell";
import { HEADER_CONFIG, type HeaderConfig } from "./platform-nav";
import { openSupportChat } from "@/components/support/goftino";

/**
 * Header config for a route. Static sub-pages live in HEADER_CONFIG; dynamic
 * ones are matched by pattern here so every nested screen gets a back button.
 * Routes with a page-specific header (e.g. the coin detail page) render their
 * own component through the `@header` slot instead and never reach this.
 */
function headerConfigFor(pathname: string): HeaderConfig {
  if (HEADER_CONFIG[pathname]) return HEADER_CONFIG[pathname];
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
 * The default platform app bar. Per-route (via HEADER_CONFIG): the home tab
 * shows the logo, section screens show a title, and nested screens show a
 * back button + title. Trailing quick actions (notifications, support) are
 * always tappable. Distinct from the marketing landing header (`site-header`).
 */
export function PlatformHeader() {
  const pathname = usePathname();
  const cfg = headerConfigFor(pathname);
  const showTitle = Boolean(cfg.title || cfg.backHref);

  return (
    <HeaderBar
      start={
        <>
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
        </>
      }
      end={
        <>
          <NotificationBell />
          <button
            type="button"
            onClick={openSupportChat}
            aria-label="پشتیبانی"
            className="flex size-11 cursor-pointer items-center justify-center rounded-xl bg-surface text-muted transition-colors hover:bg-line"
          >
            <HeadphonesIcon size={20} />
          </button>
        </>
      }
    />
  );
}
