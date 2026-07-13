import type { ComponentType } from "react";
import { CreditCardIcon, FlameIcon, ShieldIcon } from "@/components/ui/icons";
import type { IconProps } from "@/components/ui/icons";

export interface Feature {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  {
    icon: CreditCardIcon,
    title: "با تومان، بی‌واسطه",
    description:
      "نه دلار، نه تتر، نه صرافی خارجی. مستقیم با تومان بخر و هر وقت خواستی به تومان بفروش.",
  },
  {
    icon: ShieldIcon,
    title: "بدون دانش کریپتو",
    description:
      "کیف پول، رمز خصوصی و کارمزد شبکه با ماست. تو فقط توکن را انتخاب کن؛ بقیه‌اش را ناخدا می‌سپارد به زنجیره.",
  },
  {
    icon: FlameIcon,
    title: "داغ‌ترین میم‌کوین‌ها",
    description:
      "از پپه و داگ‌کوین تا تازه‌ترین توکن‌ها — هزاران توکن آنچین، یک‌جا و با قیمت لحظه‌ای.",
  },
];
