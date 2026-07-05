import type { ComponentType } from "react";
import {
  TrendingUpIcon,
  UserIcon,
  WalletIcon,
  type IconProps,
} from "@/components/ui/icons";

export interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
}

// Bottom-nav items in RTL order (first = rightmost): market â¦ account.
export const NAV_ITEMS: NavItem[] = [
  { href: "/market", label: "بازار", Icon: TrendingUpIcon },
  { href: "/wallet", label: "کیف پول", Icon: WalletIcon },
  { href: "/account", label: "حساب کاربری", Icon: UserIcon },
];

export interface HeaderConfig {
  /** Screen title; when absent the home logo shows instead. */
  title?: string;
  /** When set, the header shows a back button linking here (nested screens). */
  backHref?: string;
}

// Header overrides for SUB-pages only (nested screens) â title + optional back.
// Main tab pages are absent here, so they show the logo.
// e.g. "/market/btc": { title: "Ø¨ÛØªâÚ©ÙÛÙ", backHref: "/market" }
export const HEADER_CONFIG: Record<string, HeaderConfig> = {
  "/wallet/history": { title: "تاریخچه", backHref: "/wallet" },
  "/wallet/deposit": { title: "واریز", backHref: "/wallet" },
  "/wallet/withdraw": { title: "برداشت", backHref: "/wallet" },
  "/account/two-step": { title: "ورود دومرحله‌ای", backHref: "/account" },
};
