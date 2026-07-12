import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  /** Wordmark font size in px; the emblem scales alongside it. */
  size?: number;
  className?: string;
  /** Pass `null` to render a plain (non-linked) wordmark. */
  href?: string | null;
  /** Wordmark colour. `onBrand` (white) for brand/dark backgrounds, e.g. the splash. */
  tone?: "brand" | "onBrand";
}

// Intrinsic size of public/logo.png (the captain emblem), for CLS-safe sizing.
const EMBLEM_W = 538;
const EMBLEM_H = 408;

/**
 * The single Nakhoda logo — the captain emblem (public/logo.png) beside the
 * «ناخدا» wordmark. This is the ONE place the logo is defined; every surface
 * renders it through this component, so swapping the artwork is a one-file
 * change. Do not fork it or inline the mark elsewhere.
 */
export function Logo({
  size = 24,
  className,
  href = "/",
  tone = "brand",
}: LogoProps) {
  const h = Math.round(size * 1.7);
  const w = Math.round(h * (EMBLEM_W / EMBLEM_H));
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "font-extrabold leading-none",
          tone === "onBrand" ? "text-white" : "text-brand",
        )}
        style={{ fontSize: size }}
      >
        ناخدا
      </span>
      {/* Decorative: the adjacent wordmark (and the link's aria-label) name it. */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden
        width={w}
        height={h}
        className="object-contain"
        style={{ width: w, height: h }}
      />
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="ناخدا" className="inline-flex">
      {content}
    </Link>
  );
}
