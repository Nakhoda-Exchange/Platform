"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUpIcon, UserIcon, WalletIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

// Order = right→left in the RTL app: account (right) … market (left).
const TABS = [
  { href: "/account", label: "حساب کاربری", Icon: UserIcon },
  { href: "/wallet", label: "دارایی", Icon: WalletIcon },
  { href: "/market", label: "بازار", Icon: TrendingUpIcon },
];

/** Floating bottom nav. The tab matching the current route gets a soft-brand pill. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 px-4 pb-4">
      <div className="mx-auto flex max-w-[420px] items-center justify-between rounded-3xl border border-gray-100 bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 transition-colors",
                active && "bg-brand/10 px-4",
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
