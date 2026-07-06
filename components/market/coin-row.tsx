"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import type { Coin } from "@/lib/core/domain/market/coin";
import { CoinIcon } from "./coin-icon";
import {
  formatChangePercent,
  formatIrtShort,
  formatUsd,
} from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

// Swipe geometry: the row follows the finger up to MAX_PULL, and releasing
// past ACT_AT fires the revealed action.
const MAX_PULL = 112;
const ACT_AT = 72;
const ENGAGE_AT = 8; // px of movement before we commit to a direction

/**
 * A market list row. RTL, three zones: coin identity (icon + Persian name +
 * symbol) on the right, the 24h change centered, the Toman price on the
 * left. Tapping opens the coin detail page.
 *
 * Quick actions by swipe: sliding the row to the RIGHT reveals «خرید» and
 * releasing opens the buy screen; sliding LEFT opens the sell screen when
 * the user holds the coin, otherwise the coin page («جزئیات»). Vertical
 * panning stays with the browser (touch-action: pan-y); a horizontal drag
 * suppresses the row's own tap navigation.
 */
export function CoinRow({ coin, canSell }: { coin: Coin; canSell: boolean }) {
  const router = useRouter();
  const symbol = coin.symbol.toLowerCase();
  const up = coin.change24h >= 0;

  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  // Gesture truth lives in refs: pointer events can outrun React renders,
  // so the release handler must not read (possibly stale) state.
  const dxRef = useRef(0);
  const engagedRef = useRef(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const buyHref = `/trade/${symbol}?side=buy`;
  const leftHref = canSell ? `/trade/${symbol}?side=sell` : `/market/${symbol}`;

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
    dxRef.current = Math.max(-MAX_PULL, Math.min(MAX_PULL, ddx));
    setDx(dxRef.current);
  }

  function onPointerEnd() {
    if (engagedRef.current) {
      if (dxRef.current >= ACT_AT) router.push(buyHref);
      else if (dxRef.current <= -ACT_AT) router.push(leftHref);
    }
    start.current = null;
    engagedRef.current = false;
    dxRef.current = 0;
    setDragging(false);
    setDx(0);
  }

  return (
    <div className="relative overflow-hidden">
      {/* Action underlay: خرید behind the left edge (revealed by a rightward
          slide), فروش/جزئیات behind the right edge (leftward slide). */}
      <div aria-hidden className="absolute inset-0 flex justify-between">
        <span
          dir="ltr"
          className={cn(
            "flex w-28 items-center justify-start bg-gain pl-5 text-[14px] font-bold text-white transition-opacity",
            dx > 0 ? "opacity-100" : "opacity-0",
          )}
        >
          خرید
        </span>
        <span
          dir="ltr"
          className={cn(
            "flex w-28 items-center justify-end pr-5 text-[14px] font-bold transition-opacity",
            canSell ? "bg-loss text-white" : "bg-surface text-ink",
            dx < 0 ? "opacity-100" : "opacity-0",
          )}
        >
          {canSell ? "فروش" : "جزئیات"}
        </span>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{ transform: `translateX(${dx}px)` }}
        className={cn(
          "relative touch-pan-y bg-paper",
          !dragging && "transition-transform duration-200",
        )}
      >
        <Link
          href={`/market/${symbol}`}
          draggable={false}
          onClick={(e) => {
            if (dragged.current) e.preventDefault();
          }}
          className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3 transition-colors hover:bg-surface"
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
            {up ? "▲" : "▼"} {formatChangePercent(coin.change24h)}
          </span>

          {/* Left (RTL end): Toman price with the dollar price under it */}
          <div className="flex flex-col items-end gap-0.5 justify-self-end">
            <span className="text-[14px] font-bold text-ink">
              {formatIrtShort(coin.priceIrt)}
            </span>
            <span className="text-[12px] text-muted">
              {formatUsd(coin.priceUsd)}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
