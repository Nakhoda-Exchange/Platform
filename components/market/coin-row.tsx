"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "./coin-icon";
import { ChevronRightIcon, CoinsIcon, WalletIcon } from "@/components/ui/icons";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

// Swipe-action geometry, modelled on Apple's row swipe actions. The row tracks
// the finger with rubber-band resistance past MAX_PULL; releasing past
// COMMIT_AT fires the revealed action, otherwise the row springs back. As the
// row slides, the action panel behind it grows and its icon + label fade and
// scale in — so the gesture always previews what it will do, and firms up
// ("armed") once you've pulled far enough to commit.
const ENGAGE_AT = 10; // px of travel before we lock to a horizontal drag
const REVEAL_AT = 44; // px by which the label is fully faded in (readable early)
const COMMIT_AT = 96; // px past which releasing triggers the action
const MAX_PULL = 132; // soft cap; further travel gets rubber-band resistance

// One spring curve for the snap-back and for the icon fade, so they settle
// together. Applied only when NOT actively dragging (drag tracks 1:1).
const SNAP = "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)";
const FADE =
  "opacity 340ms ease, transform 340ms cubic-bezier(0.22, 1, 0.36, 1)";

/** Rubber-band the drag past the soft cap so it never runs away. */
function resist(dx: number): number {
  const abs = Math.abs(dx);
  if (abs <= MAX_PULL) return dx;
  return Math.sign(dx) * (MAX_PULL + (abs - MAX_PULL) * 0.3);
}

/**
 * A market list row. RTL, three zones: coin identity (icon + Persian name +
 * symbol) on the right, the 24h change centered, the Toman price on the left.
 * Tapping opens the coin detail page.
 *
 * Quick trade by swipe (the primary way to buy/sell): drag the row LEFT to
 * reveal «خرید» and release to open the buy screen; drag RIGHT to reveal «فروش»
 * (when the user holds the coin) or «جزئیات» otherwise. Vertical panning stays
 * with the browser (touch-action: pan-y); a horizontal drag suppresses the
 * row's own tap navigation.
 */
export function CoinRow({ coin, canSell }: { coin: Coin; canSell: boolean }) {
  const router = useRouter();
  const symbol = coin.symbol.toLowerCase();
  const up = coin.change24h >= 0;

  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  // Gesture truth lives in refs: pointer events can outrun React renders, so
  // the release handler must not read (possibly stale) state.
  const dxRef = useRef(0);
  const engagedRef = useRef(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const buyHref = `/trade/${symbol}?side=buy`;
  const trailHref = canSell
    ? `/trade/${symbol}?side=sell`
    : `/market/${symbol}`;

  // Reveal progress toward the commit point, per side (0…1), and whether the
  // pull is far enough that a release will fire ("armed"). Buy is the LEFT
  // pull (dx < 0); the trailing action (sell/details) is the RIGHT pull.
  const buyProgress = dx < 0 ? Math.min(-dx / COMMIT_AT, 1) : 0;
  const trailProgress = dx > 0 ? Math.min(dx / COMMIT_AT, 1) : 0;
  const buyArmed = dx <= -COMMIT_AT;
  const trailArmed = dx >= COMMIT_AT;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary) return;
    start.current = { x: e.clientX, y: e.clientY };
    dragged.current = false;
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const ddx = e.clientX - start.current.x;
    const ddy = e.clientY - start.current.y;
    if (!engagedRef.current) {
      if (Math.abs(ddx) < ENGAGE_AT) return;
      if (Math.abs(ddx) <= Math.abs(ddy)) {
        start.current = null; // vertical intent — let the page scroll
        return;
      }
      engagedRef.current = true;
      dragged.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    dxRef.current = resist(ddx);
    setDx(dxRef.current);
  }

  function onPointerEnd() {
    if (engagedRef.current) {
      if (dxRef.current <= -COMMIT_AT) router.push(buyHref);
      else if (dxRef.current >= COMMIT_AT) router.push(trailHref);
    }
    start.current = null;
    engagedRef.current = false;
    dxRef.current = 0;
    setDragging(false);
    setDx(0); // spring back to rest
  }

  const trailLabel = canSell ? "فروش" : "جزئیات";
  const TrailIcon = canSell ? WalletIcon : ChevronRightIcon;

  // Label opacity fills in by REVEAL_AT so it's readable on a slight swipe;
  // the icon+label scale in with progress, then firm up with a pop when armed.
  const buyReveal = dx < 0 ? Math.min(-dx / REVEAL_AT, 1) : 0;
  const trailReveal = dx > 0 ? Math.min(dx / REVEAL_AT, 1) : 0;
  const buyScale = buyArmed ? 1.1 : 0.9 + 0.1 * buyProgress;
  const trailScale = trailArmed ? 1.1 : 0.9 + 0.1 * trailProgress;

  return (
    <div className="relative overflow-hidden">
      {/* Action panels behind the row, revealed as it slides. خرید on the
          right edge (revealed by a leftward pull), فروش/جزئیات on the left
          edge (revealed by a rightward pull). dir="ltr" pins each label to the
          PHYSICAL edge it's revealed from (RTL would push it toward the center,
          out of the swipe's reach), so even a small pull shows a readable icon
          + label — the indicator — which firms up with a pop once armed. */}
      <div aria-hidden className="absolute inset-0">
        <div
          dir="ltr"
          className="absolute inset-y-0 right-0 flex w-40 items-center justify-end bg-gain pr-4 text-white"
        >
          <span
            className="flex items-center gap-1.5 text-[14px] font-bold"
            style={{
              opacity: buyReveal,
              transform: `scale(${buyScale})`,
              transition: dragging ? undefined : FADE,
            }}
          >
            <CoinsIcon size={20} />
            خرید
          </span>
        </div>
        <div
          dir="ltr"
          className={cn(
            "absolute inset-y-0 left-0 flex w-40 items-center justify-start pl-4",
            canSell ? "bg-loss text-white" : "bg-surface text-ink",
          )}
        >
          <span
            className="flex items-center gap-1.5 text-[14px] font-bold"
            style={{
              opacity: trailReveal,
              transform: `scale(${trailScale})`,
              transition: dragging ? undefined : FADE,
            }}
          >
            <TrailIcon size={20} />
            {trailLabel}
          </span>
        </div>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? undefined : SNAP,
        }}
        className="relative touch-pan-y select-none bg-paper"
      >
        <Link
          href={`/market/${symbol}`}
          draggable={false}
          onClick={(e) => {
            if (dragged.current) e.preventDefault();
          }}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 transition-colors hover:bg-surface"
        >
          {/* Right (RTL start): identity */}
          <div className="flex items-center gap-3">
            <CoinIcon coin={coin} size={42} />
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-ink">
                {coin.name}
              </span>
              <span className="text-[12px] text-muted">{coin.symbol}</span>
            </div>
          </div>

          {/* Center: 24h change */}
          <span
            dir="ltr"
            aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)} در ۲۴ ساعت`}
            className={cn(
              "justify-self-center text-[13px] font-bold",
              up ? "text-gain" : "text-loss",
            )}
          >
            {formatChangePercent(coin.change24h)}
          </span>

          {/* Left (RTL end): Toman price. The 24h change sits centered (above),
              so price and percent read as the two data points — no USD. */}
          <div className="flex flex-col items-end justify-self-end">
            <span className="text-[14px] font-bold text-ink">
              {formatIrtShort(coin.priceIrt)}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
