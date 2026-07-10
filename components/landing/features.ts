import type { ComponentType } from "react";
import { AnchorIcon, CoinsIcon, ZapOffIcon } from "@/components/ui/icons";
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
    description:
      "رابط سبک و بی‌دردسر؛ خرید و فروش تنها با چند حرکت، بدون منوهای پیچیده.",
  },
  {
    icon: CoinsIcon,
    title: "صدها رمزارز",
    description:
      "از بیت‌کوین تا میم‌کوین‌های نوظهور — همه در یک عرشه، با قیمت لحظه‌ای.",
  },
  {
    icon: AnchorIcon,
    title: "شروع در یک دقیقه",
    description:
      "فقط با شماره موبایل لنگر بینداز؛ احراز هویت آنی و اولین معامله بی‌معطلی.",
  },
];
