"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

// On-palette celebration: brand blues + a gain-green accent (a first trade is a
// positive state, so green is allowed alongside the blues).
const COLORS = ["bg-brand", "bg-brand/60", "bg-gain", "bg-brand/30"];

/**
 * A one-shot confetti burst — a fixed overlay of pieces that fall, spin, and
 * fade out. No dependency, no canvas. Purely decorative (aria-hidden) and
 * silent under `prefers-reduced-motion`. Pieces are randomised once on mount
 * (client-only, so no hydration mismatch).
 */
export function Confetti({ count = 44 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.4,
      size: 6 + Math.round(Math.random() * 6),
      color: COLORS[i % COLORS.length],
    })),
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden motion-reduce:hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className={cn("absolute top-0 rounded-[2px]", p.color)}
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
