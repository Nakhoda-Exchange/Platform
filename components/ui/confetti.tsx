"use client";

import { useEffect, useRef } from "react";

// Celebration emojis, with a couple of naval ones for «ناخدای جوان».
const EMOJIS = ["🎉", "🎊", "⚓", "🚢", "✨", "🥳", "🎈"];

const COUNT = 44;
const GRAVITY = 0.42; // px / frame², pulls pieces back down
const DRAG = 0.992; // horizontal air resistance per frame
const FADE_FRAMES = 26;

/**
 * Emoji confetti with real ballistics: two cannons at the bottom corners shoot
 * pieces up-and-inward with randomised speed/angle/spin, gravity arcs them over,
 * then they fall and fade. Driven by a rAF loop writing transforms straight to
 * the DOM (no per-frame React renders). Decorative (aria-hidden) and a no-op
 * under `prefers-reduced-motion`.
 */
export function Confetti() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const rad = (deg: number) => (deg * Math.PI) / 180;

    const pieces = Array.from({ length: COUNT }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const el = document.createElement("span");
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      el.style.position = "absolute";
      el.style.left = "0";
      el.style.top = "0";
      el.style.fontSize = `${18 + Math.random() * 16}px`;
      el.style.lineHeight = "1";
      el.style.willChange = "transform, opacity";
      container.appendChild(el);

      const speed = 16 + Math.random() * 12;
      // Left cannon aims up-and-right (−45°…−80°), right cannon up-and-left.
      const angle = fromLeft
        ? rad(-(45 + Math.random() * 35))
        : rad(-(100 + Math.random() * 35));
      return {
        el,
        x: fromLeft ? W * 0.06 : W * 0.94,
        y: H * 0.92,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * 360,
        vrot: (Math.random() * 2 - 1) * 22,
        life: 0,
        ttl: 95 + Math.random() * 45,
      };
    });

    let raf = 0;
    const tick = () => {
      let alive = false;
      for (const p of pieces) {
        if (p.life > p.ttl) continue;
        alive = true;
        p.vy += GRAVITY;
        p.vx *= DRAG;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life++;
        const left = p.ttl - p.life;
        p.el.style.opacity =
          left < FADE_FRAMES ? String(Math.max(0, left / FADE_FRAMES)) : "1";
        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`;
      }
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      pieces.forEach((p) => p.el.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    />
  );
}
