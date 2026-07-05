"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { toEnglishDigits } from "@/lib/utils/digits";

interface OtpInputProps {
  length?: number;
  /** Called with the joined code whenever it changes. */
  onChange?: (code: string) => void;
  name?: string;
  autoFocus?: boolean;
}

/**
 * Segmented OTP input, left-to-right (the conventional order for a numeric
 * code). The first box is focused on mount and entry advances rightward.
 *
 * iOS Safari notes: no `maxLength` so SMS autofill (`one-time-code`) can drop
 * all digits into the first box — `handleChange` then spreads them across the
 * boxes. Paste is handled the same way. The joined code posts via a hidden
 * field.
 */
export function OtpInput({
  length = 6,
  onChange,
  name = "code",
  autoFocus = true,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(() => Array(length).fill(""));
  const [focused, setFocused] = useState<number | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string[]) => {
    setValues(next);
    onChange?.(next.join(""));
  };

  const focusBox = (i: number) =>
    refs.current[Math.max(0, Math.min(i, length - 1))]?.focus();

  const handleChange = (i: number, raw: string) => {
    const digits = toEnglishDigits(raw).replace(/\D/g, "");

    // Cleared the box (e.g. selecting and deleting).
    if (!digits) {
      const next = [...values];
      next[i] = "";
      commit(next);
      return;
    }

    // Spread one or many digits (autofill/paste) starting at this box.
    const next = [...values];
    let idx = i;
    for (const d of digits) {
      if (idx >= length) break;
      next[idx] = d;
      idx += 1;
    }
    commit(next);
    focusBox(idx);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[i] && i > 0) {
      e.preventDefault();
      const next = [...values];
      next[i - 1] = "";
      commit(next);
      focusBox(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  return (
    <div dir="ltr" className="flex w-full gap-2 sm:gap-3">
      {values.map((value, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`رقم ${i + 1}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => {
            setFocused(i);
            e.currentTarget.select();
          }}
          onBlur={() => setFocused(null)}
          className={cn(
            "h-14 min-w-0 flex-1 rounded-[14px] border-[1.5px] text-center text-[24px] font-bold text-ink outline-none transition-colors",
            focused === i
              ? "border-brand bg-[#e6e9ff]"
              : value
                ? "border-placeholder/60 bg-paper"
                : "border-line bg-paper",
          )}
        />
      ))}
      <input type="hidden" name={name} value={values.join("")} />
    </div>
  );
}
