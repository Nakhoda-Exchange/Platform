import type { ComponentType } from "react";
import { CoinsIcon, SmartphoneIcon, ZapOffIcon } from "@/components/ui/icons";
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
    icon: SmartphoneIcon,
    title: "شروع در یک دقیقه",
    description:
      "فقط با شماره موبایل شروع کن؛ احراز هویت سریع و اولین معامله بی‌معطلی.",
  },
];
