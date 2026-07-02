import type { ComponentType } from "react";
import { CoinsIcon, RocketIcon, ZapOffIcon } from "@/components/ui/icons";
import type { IconProps } from "@/components/ui/icons";

export interface Feature {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    icon: ZapOffIcon,
    title: "سریع و روان",
    description: "رابط کاربری سبک و ساده برای انجام معاملات بدون پیچیدگی.",
  },
  {
    icon: CoinsIcon,
    title: "تنوع آلت‌کوین‌ها",
    description:
      "به طیف گسترده‌ای از آلت‌کوین‌ها و میم‌کوین‌های محبوب دسترسی داشته باشید.",
  },
  {
    icon: RocketIcon,
    title: "شروع آسان",
    description: "فقط با شماره موبایل در کمتر از یک دقیقه وارد بازار شوید.",
  },
];
