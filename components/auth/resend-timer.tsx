"use client";

import { useEffect, useState } from "react";
import { resendOtp } from "@/app/actions/auth";
import { toPersianDigits } from "@/lib/utils/digits";

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return toPersianDigits(`${mm}:${ss}`);
}

/**
 * Counts down until the user may resend the code. While counting it shows the
 * remaining time; at zero it turns into a resend action.
 */
export function ResendTimer({
  seconds = 120,
  phone,
}: {
  seconds?: number;
  phone: string;
}) {
  const [remaining, setRemaining] = useState(seconds);

  // One stable interval for the whole countdown. Re-creating it every tick
  // (by depending on `remaining`) is fragile on iOS Safari's throttled timers.
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  if (remaining > 0) {
    return (
      <div className="flex w-full justify-center gap-1 text-[14px] text-slate-500">
        <span>ارسال مجدد تا</span>
        <span dir="ltr">{formatClock(remaining)}</span>
      </div>
    );
  }

  return (
    <form action={resendOtp} className="flex w-full justify-center">
      <input type="hidden" name="mobile" value={phone} />
      <button
        type="submit"
        className="cursor-pointer text-[14px] font-bold text-brand hover:underline"
      >
        ارسال مجدد کد
      </button>
    </form>
  );
}
