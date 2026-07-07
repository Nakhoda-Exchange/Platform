"use client";

import { useState, type CSSProperties } from "react";

// Celebration emojis, with a couple of naval ones for «ناخدای جوان».
const EMOJIS = ["🎉", "🎊", "⚓", "🚢", "✨", "🥳", "🎈"];

/**
 * A one-shot emoji confetti burst — pieces pop inward from the two side edges,
 * arc up, then fall away. No dependency, no canvas. Purely decorative
 * (aria-hidden) and silent under `prefers-reduced-motion`. Pieces are
 * randomised once on mount (client-only, so no hydration mismatch).
 */
export function Confetti({ count = 30 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0; // alternate the two side cannons
      const mag = 28 + Math.random() * 56; // vw travelled inward
      return {
        id: i,
        fromLeft,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        dx: `${fromLeft ? mag : -mag}vw`,
        peak: `${-(16 + Math.random() * 24)}vh`,
        rot: `${(Math.random() * 2 - 1) * 540}deg`,
        top: `${46 + Math.random() * 22}%`,
        size: 20 + Math.round(Math.random() * 14),
        delay: Math.random() * 0.25,
        duration: 1.6 + Math.random() * 1,
      };
    }),
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden motion-reduce:hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute leading-none"
          style={
            {
              [p.fromLeft ? "left" : "right"]: 0,
              top: p.top,
              fontSize: p.size,
              animation: `confetti-pop ${p.duration}s cubic-bezier(0.2, 0.7, 0.3, 1) ${p.delay}s forwards`,
              "--dx": p.dx,
              "--peak": p.peak,
              "--rot": p.rot,
            } as CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
