import Link from "next/link";
import { ShipWheelIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** Text size in px; the wheel scales alongside it. */
  size?: number;
  className?: string;
  /** Pass `null` to render a plain (non-linked) wordmark. */
  href?: string | null;
}

/** The Nakhoda wordmark: "ناخدا" beside the ship-wheel mark. */
export function Logo({ size = 24, className, href = "/" }: LogoProps) {
  const content = (
    <span className={cn("flex items-center gap-2 text-brand", className)}>
      <span
        className="font-extrabold text-ink"
        style={{ fontSize: size, lineHeight: 1 }}
      >
        ناخدا
      </span>
      <ShipWheelIcon size={Math.round(size * 1.15)} />
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="ناخدا" className="inline-flex">
      {content}
    </Link>
  );
}
