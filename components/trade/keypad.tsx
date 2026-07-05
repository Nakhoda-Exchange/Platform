"use client";

import { toPersianDigits } from "@/lib/utils/digits";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Numeric keypad for Toman amounts (Moonshot-style). Digits flow LTR like a
 * phone dial pad, labels are Persian. Tap targets are 56px tall.
 */
export function Keypad({
  onDigit,
  onBackspace,
  decimal = false,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  /** Show a «٫» key (coin-unit entry needs fractions). */
  decimal?: boolean;
}) {
  const key =
    "h-14 rounded-field text-[22px] font-bold text-ink transition-colors hover:bg-surface active:bg-line";
  return (
    <div dir="ltr" className="grid grid-cols-3 gap-1">
      {KEYS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onDigit(d)}
          className={key}
        >
          {toPersianDigits(d)}
        </button>
      ))}
      {decimal ? (
        <button
          type="button"
          onClick={() => onDigit(".")}
          aria-label="ممیز"
          className={key}
        >
          ٫
        </button>
      ) : (
        <span aria-hidden />
      )}
      <button type="button" onClick={() => onDigit("0")} className={key}>
        {toPersianDigits("0")}
      </button>
      <button
        type="button"
        onClick={onBackspace}
        aria-label="پاک کردن"
        className={key}
      >
        ⌫
      </button>
    </div>
  );
}
