"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Brief «معامله در حال انجام» confirmation shown after a (non-first) trade
 * sends the user back to the wallet. Fades itself out after a few seconds.
 */
export function TradePendingToast() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), 3200);
    const drop = setTimeout(() => setGone(true), 3600);
    return () => {
      clearTimeout(fade);
      clearTimeout(drop);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-fit max-w-[440px] rounded-full bg-ink px-5 py-3 text-[14px] font-bold text-paper shadow-lg transition-opacity duration-300",
        leaving ? "opacity-0" : "opacity-100",
      )}
    >
      معامله در حال انجام
    </div>
  );
}
