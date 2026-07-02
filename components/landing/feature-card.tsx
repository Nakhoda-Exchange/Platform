import { Card } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import type { Feature } from "./features";

export function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <Card
      dir="rtl"
      className="flex flex-col items-start gap-4 p-6 text-right sm:p-8"
    >
      <IconBadge>
        <Icon size={24} />
      </IconBadge>
      <h3 className="text-[20px] font-extrabold text-ink">{title}</h3>
      <p className="text-[16px] leading-[1.7] text-muted">{description}</p>
    </Card>
  );
}
