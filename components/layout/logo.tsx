import Link from "next/link";
import { AnchorIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** Wordmark font size in px; the anchor tile scales alongside it. */
  size?: number;
  className?: string;
  /** Pass `null` to render a plain (non-linked) wordmark. */
  href?: string | null;
}

/**
 * The single Nakhoda logo — used everywhere: "ناخدا" wordmark beside the anchor
 * mark in a filled brand tile. There is only one logo; do not fork it.
 */
export function Logo({ size = 24, className, href = "/" }: LogoProps) {
  const tile = Math.round(size * 1.5);
  const content = (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        className="font-extrabold leading-none text-brand"
        style={{ fontSize: size }}
      >
        ناخدا
      </span>
      <span
        className="flex items-center justify-center rounded-[10px] bg-brand text-white"
        style={{ width: tile, height: tile }}
      >
        <AnchorIcon size={Math.round(tile * 0.55)} />
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="ناخدا" className="inline-flex">
      {content}
    </Link>
  );
}
