"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

const ANIM_MS = 300;
const CLOSE_THRESHOLD = 96; // px of downward drag that dismisses the sheet

/**
 * Bottom sheet: dimmed backdrop + a panel that slides up from the bottom and
 * back down on close. Capped to the platform's phone width and centred, so on
 * desktop it sits inside the frame (keep max-w in sync with AppShell). Drag the
 * handle down past a threshold — or tap the backdrop / press Esc — to dismiss.
 *
 * Controlled by the parent via `open`; it stays mounted through the close
 * animation, then unmounts itself. Honours `prefers-reduced-motion`.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  panelClassName,
  manageBack = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Extra classes for the panel, e.g. a fixed height like `h-[90vh]`. */
  panelClassName?: string;
  /**
   * Whether the back gesture closes the sheet (default). Turn off when the
   * opener drives its own navigation on close (e.g. the trade confirm sheet
   * that redirects on success), so the two don't fight over history.
   */
  manageBack?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false); // drives the slide in/out
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const dragRef = useRef(0);
  const startYRef = useRef(0);
  const pushedRef = useRef(false);
  const poppedRef = useRef(false);

  // Mount while open; on close, play the exit then unmount. setState only ever
  // runs inside rAF/timeout callbacks (never directly in the effect body).
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    const id = requestAnimationFrame(() => setShown(false));
    const timer = setTimeout(() => {
      setMounted(false);
      setDrag(0);
      dragRef.current = 0;
    }, ANIM_MS);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(timer);
    };
  }, [open]);

  // Slide in on the frame after mount so the enter transition actually runs.
  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  // Esc closes, matching the backdrop tap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Back gesture (browser/phone back) closes the sheet instead of navigating:
  // push a throwaway history entry while open, and pop it on close. If the user
  // closed via the UI (backdrop/drag/Esc), unwind our entry with history.back()
  // so no phantom entry is left behind.
  useEffect(() => {
    if (!open || !manageBack) return;
    poppedRef.current = false;
    if (!pushedRef.current) {
      window.history.pushState({ nakhodaSheet: true }, "");
      pushedRef.current = true;
    }
    const onPop = () => {
      poppedRef.current = true;
      pushedRef.current = false; // the browser already dropped our entry
      onClose();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (pushedRef.current && !poppedRef.current) {
        pushedRef.current = false;
        window.history.back();
      }
    };
  }, [open, manageBack, onClose]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    setDragging(true);
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dy = Math.max(0, e.clientY - startYRef.current);
    dragRef.current = dy;
    setDrag(dy);
  };
  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    if (dragRef.current > CLOSE_THRESHOLD) {
      onClose(); // keep the offset — the exit animation continues from here
    } else {
      dragRef.current = 0;
      setDrag(0); // snap back
    }
  };

  if (!open && !mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="بستن"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none",
          shown ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        style={{
          transform: shown ? `translateY(${drag}px)` : "translateY(100%)",
        }}
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[440px] flex-col gap-4 rounded-t-card bg-paper p-5",
          "pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
          dragging
            ? "transition-none"
            : "transition-transform duration-300 ease-out motion-reduce:transition-none",
          panelClassName,
        )}
      >
        {/* Grab zone — drag down to dismiss. touch-none so the drag doesn't
            scroll the page; inner content keeps its own scrolling. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex touch-none cursor-grab flex-col gap-4 active:cursor-grabbing"
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
          <h2 className="text-[17px] font-extrabold text-ink">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
