"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  MonitorIcon,
  MoonIcon,
  SunIcon,
  type IconProps,
} from "@/components/ui/icons";
import {
  applyThemePref,
  getThemePref,
  type ThemePref,
} from "@/lib/utils/theme";
import { cn } from "@/lib/utils/cn";

const OPTIONS: {
  value: ThemePref;
  label: string;
  Icon: ComponentType<IconProps>;
}[] = [
  { value: "system", label: "سیستم", Icon: MonitorIcon },
  { value: "light", label: "روشن", Icon: SunIcon },
  { value: "dark", label: "تیره", Icon: MoonIcon },
];

/**
 * «حالت نمایش» — a full-width system/light/dark segmented control (icon +
 * label per segment). The preference lives in localStorage; the pre-paint
 * script in the root layout restores it. State is read in an effect (SSR can't
 * know it), so it hydrates on «سیستم» and settles instantly.
 */
export function ThemeSelector() {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    // localStorage is client-only; hydrate on «سیستم», settle to the stored pref.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPref(getThemePref());
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="حالت نمایش"
      className="grid grid-cols-3 gap-1 rounded-full border border-line bg-surface p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          onClick={() => {
            setPref(value);
            applyThemePref(value);
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-bold transition-colors",
            pref === value
              ? "bg-brand text-white"
              : "text-muted hover:text-ink",
          )}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}
