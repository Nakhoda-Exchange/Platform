"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Minimal bottom sheet: dimmed backdrop + a panel sliding from the bottom.
 * Controlled by the parent; closes on backdrop tap. Content stays mounted
 * only while open (state lives in the parent's inputs, not here).
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
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
        className="absolute inset-0 bg-black/40"
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-card bg-white p-5",
          "pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-line" aria-hidden />
        <h2 className="text-[17px] font-extrabold text-ink">{title}</h2>
        {children}
      </div>
    </div>
  );
}
