"use client";

import { useEffect, useState } from "react";
import { MoonIcon } from "@/components/ui/icons";
import {
  applyThemePref,
  getThemePref,
  type ThemePref,
} from "@/lib/utils/theme";
import { cn } from "@/lib/utils/cn";

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "system", label: "سیستم" },
  { value: "light", label: "روشن" },
  { value: "dark", label: "تیره" },
];

/**
 * «حالت نمایش» — segmented system/light/dark picker. The preference lives in
 * localStorage; the pre-paint script in the root layout restores it on load.
 * State is read in an effect (SSR can't know it), so the row hydrates on
 * «سیستم» and settles instantly.
 */
export function ThemeRow() {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    // localStorage is client-only; hydrate on «سیستم», settle to the stored pref.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPref(getThemePref());
  }, []);

  return (
    <div className="flex w-full items-center justify-between gap-3 py-3">
      <span className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-field bg-surface text-muted"
        >
          <MoonIcon size={20} />
        </span>
        <span className="text-[15px] font-bold text-ink">حالت نمایش</span>
      </span>
      <div
        role="radiogroup"
        aria-label="حالت نمایش"
        className="flex rounded-full bg-surface p-1"
      >
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={pref === o.value}
            onClick={() => {
              setPref(o.value);
              applyThemePref(o.value);
            }}
            className={cn(
              "h-9 rounded-full px-3 text-[13px] font-bold transition-colors",
              pref === o.value ? "bg-brand text-white" : "text-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
