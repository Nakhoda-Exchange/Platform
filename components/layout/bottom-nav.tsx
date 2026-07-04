"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./platform-nav";
import { cn } from "@/lib/utils/cn";

/**
 * Floating bottom tab bar for the authenticated platform. Active tab (by route)
 * gets a soft-brand pill. Sticky with iOS safe-area padding; RTL order.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-[420px] grid-cols-3 gap-1 rounded-3xl border border-gray-100 bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 transition-colors",
                active && "bg-brand/10",
              )}
            >
              <Icon
                size={24}
                className={active ? "text-brand" : "text-gray-400"}
              />
              <span
                className={cn(
                  "text-[11px]",
                  active ? "font-bold text-brand" : "font-medium text-gray-400",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
