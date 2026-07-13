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
    title: "با تومان، خلاص",
    description:
      "نه دلار، نه تتر، نه صرافی خارجی. با تومان بخر، هر وقت خواستی با تومان بفروش.",
  },
  {
    icon: ShieldIcon,
    title: "کریپتو بلد نیستی؟ مهم نیست",
    description:
      "کیف پول و رمز خصوصی و کارمزد شبکه با ماست. تو فقط توکن رو انتخاب کن و بزن بخر.",
  },
  {
    icon: FlameIcon,
    title: "همیشه داغ‌ترین‌ها",
    description:
      "تازه‌ترین میم‌کوین‌ها، همون لحظه‌ای که ترند می‌شن، این‌جا با قیمت زنده‌ان.",
  },
];
