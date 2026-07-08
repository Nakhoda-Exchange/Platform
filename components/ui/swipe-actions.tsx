"use client";

import {
  useRef,
  useState,
  type ComponentType,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { IconProps } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

// Swipe-action geometry, modelled on Apple's row swipe actions. The row tracks
// the finger with rubber-band resistance past MAX_PULL; releasing past
// COMMIT_AT fires the revealed action, otherwise the row springs back.
const ENGAGE_AT = 10; // px of travel before we lock to a horizontal drag
const REVEAL_AT = 44; // px by which the label is fully faded in
const COMMIT_AT = 96; // px past which releasing triggers the action
const MAX_PULL = 132; // soft cap; further travel gets rubber-band resistance

const SNAP = "transform 340ms cubic-bezier(0.22, 1, 0.36, 1)";
const FADE =
  "opacity 340ms ease, transform 340ms cubic-bezier(0.22, 1, 0.36, 1)";

const TONE = {
  gain: "bg-gain text-white",
  loss: "bg-loss text-white",
  brand: "bg-brand text-white",
  neutral: "bg-surface text-ink",
} as const;

export type SwipeAction = {
  label: string;
  Icon: ComponentType<IconProps>;
  tone: keyof typeof TONE;
  onCommit: () => void;
};

/** Rubber-band the drag past the soft cap so it never runs away. */
function resist(dx: number): number {
  const abs = Math.abs(dx);
  if (abs <= MAX_PULL) return dx;
  return Math.sign(dx) * (MAX_PULL + (abs - MAX_PULL) * 0.3);
}

/**
 * Wrap a list row in Apple-style swipe quick-actions. `left` fires on a
 * leftward pull (its panel is revealed on the right edge), `right` on a
 * rightward pull (panel on the left edge). A horizontal drag suppresses the
 * child's own tap; vertical panning stays with the page (touch-action: pan-y).
 */
export function SwipeActions({
  left,
  right,
  children,
}: {
  left: SwipeAction;
  right: SwipeAction;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  // Gesture truth lives in refs — pointer events can outrun React renders.
  const dxRef = useRef(0);
  const engagedRef = useRef(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const leftProgress = dx < 0 ? Math.min(-dx / COMMIT_AT, 1) : 0;
  const rightProgress = dx > 0 ? Math.min(dx / COMMIT_AT, 1) : 0;
  const leftArmed = dx <= -COMMIT_AT;
  const rightArmed = dx >= COMMIT_AT;
  const leftReveal = dx < 0 ? Math.min(-dx / REVEAL_AT, 1) : 0;
  const rightReveal = dx > 0 ? Math.min(dx / REVEAL_AT, 1) : 0;
  const leftScale = leftArmed ? 1.1 : 0.9 + 0.1 * leftProgress;
  const rightScale = rightArmed ? 1.1 : 0.9 + 0.1 * rightProgress;

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
      if (dxRef.current <= -COMMIT_AT) left.onCommit();
      else if (dxRef.current >= COMMIT_AT) right.onCommit();
    }
    start.current = null;
    engagedRef.current = false;
    dxRef.current = 0;
    setDragging(false);
    setDx(0); // spring back to rest
  }

  const LeftIcon = left.Icon;
  const RightIcon = right.Icon;

  return (
    <div className="relative overflow-hidden">
      {/* Action panels behind the row. dir="ltr" pins each label to the physical
          edge it's revealed from, so even a small pull previews the action. */}
      <div aria-hidden className="absolute inset-0">
        <div
          dir="ltr"
          className={cn(
            "absolute inset-y-0 right-0 flex w-40 items-center justify-end pr-4",
            TONE[left.tone],
          )}
        >
          <span
            className="flex items-center gap-1.5 text-[14px] font-bold"
            style={{
              opacity: leftReveal,
              transform: `scale(${leftScale})`,
              transition: dragging ? undefined : FADE,
            }}
          >
            <LeftIcon size={20} />
            {left.label}
          </span>
        </div>
        <div
          dir="ltr"
          className={cn(
            "absolute inset-y-0 left-0 flex w-40 items-center justify-start pl-4",
            TONE[right.tone],
          )}
        >
          <span
            className="flex items-center gap-1.5 text-[14px] font-bold"
            style={{
              opacity: rightReveal,
              transform: `scale(${rightScale})`,
              transition: dragging ? undefined : FADE,
            }}
          >
            <RightIcon size={20} />
            {right.label}
          </span>
        </div>
      </div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // A committed drag must not also fire the child's tap navigation.
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? undefined : SNAP,
        }}
        className="relative touch-pan-y select-none bg-paper"
      >
        {children}
      </div>
    </div>
  );
}
