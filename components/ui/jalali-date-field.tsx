"use client";

import { useEffect, useRef, useState } from "react";
import { jalaaliMonthLength } from "jalaali-js";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { JALALI_MONTHS } from "@/lib/utils/jalali";
import { toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

const ITEM_HEIGHT = 44; // px — also the min tap target
const VISIBLE_ROWS = 5;

/** One snap-scroll drum column. Tap or scroll; the center row is selected. */
function WheelColumn({
  label,
  values,
  render,
  selected,
  onSelect,
}: {
  label: string;
  values: number[];
  render: (value: number) => string;
  selected: number;
  onSelect: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const pad = (ITEM_HEIGHT * (VISIBLE_ROWS - 1)) / 2;

  // Keep the scroll position on the selected value (initial + external clamps).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = values.indexOf(selected);
    if (index < 0) return;
    const top = index * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top });
  }, [values, selected]);

  const handleScroll = () => {
    // Debounced settle: scrollend isn't available in all engines.
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const index = Math.min(
        values.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)),
      );
      if (values[index] !== selected) onSelect(values[index]);
    }, 120);
  };

  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-[12px] text-muted">{label}</span>
      <div
        className="relative w-full"
        style={{ height: ITEM_HEIGHT * VISIBLE_ROWS }}
      >
        {/* center-row highlight */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-field bg-brand/5"
          style={{ height: ITEM_HEIGHT }}
        />
        <div
          ref={ref}
          role="listbox"
          aria-label={label}
          onScroll={handleScroll}
          className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: pad, paddingBottom: pad }}
        >
          {values.map((value) => (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={value === selected}
              onClick={() => onSelect(value)}
              className={cn(
                "flex w-full snap-center items-center justify-center text-[17px] transition-colors",
                value === selected ? "font-extrabold text-brand" : "text-muted",
              )}
              style={{ height: ITEM_HEIGHT }}
            >
              {render(value)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Birth-date field: a field-look button showing «۱۵ شهریور ۱۳۷۵» that opens a
 * bottom sheet with a three-drum Jalali wheel (روز/ماه/سال, RTL order). No
 * typing, no invalid dates — day counts follow the month/leap year
 * (jalaali-js). Posts the normalized `YYYY/MM/DD` via a hidden input, so the
 * existing validation and server actions are untouched. Used by the KYC
 * identity form and the two-step password reset.
 */
export function JalaliDateField({
  label,
  name,
  value,
  onChange,
  minYear = 1300,
  maxYear = 1404,
}: {
  label: string;
  name: string;
  /** Normalized `YYYY/MM/DD` (Latin digits) or "" when unset. */
  value: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const parsed = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value);
  const [jy, setJy] = useState(parsed ? Number(parsed[1]) : 1375);
  const [jm, setJm] = useState(parsed ? Number(parsed[2]) : 6);
  const [jd, setJd] = useState(parsed ? Number(parsed[3]) : 15);

  // Day count follows month + leap year; clamp when the month shrinks.
  const daysInMonth = jalaaliMonthLength(jy, jm);
  const day = Math.min(jd, daysInMonth);

  const display = parsed
    ? `${toPersianDigits(Number(parsed[3]))} ${JALALI_MONTHS[Number(parsed[2]) - 1]} ${toPersianDigits(parsed[1])}`
    : "";

  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "h-12 w-full rounded-[var(--radius-field)] border border-line bg-surface px-4 text-right text-[16px] leading-[1.6] transition-colors focus-visible:border-brand focus-visible:outline-none",
          display ? "text-ink" : "text-placeholder",
        )}
      >
        {display || "انتخاب تاریخ تولد"}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="flex gap-2" dir="rtl">
          <WheelColumn
            label="روز"
            values={range(1, daysInMonth)}
            render={(v) => toPersianDigits(v)}
            selected={day}
            onSelect={setJd}
          />
          <WheelColumn
            label="ماه"
            values={range(1, 12)}
            render={(v) => JALALI_MONTHS[v - 1]}
            selected={jm}
            onSelect={setJm}
          />
          <WheelColumn
            label="سال"
            values={range(minYear, maxYear)}
            render={(v) => toPersianDigits(v)}
            selected={jy}
            onSelect={setJy}
          />
        </div>
        <Button
          type="button"
          size="lg"
          fullWidth
          onClick={() => {
            onChange(`${jy}/${pad2(jm)}/${pad2(day)}`);
            setOpen(false);
          }}
        >
          تأیید
        </Button>
      </Sheet>
    </div>
  );
}
