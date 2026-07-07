"use client";

import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/button";

/**
 * Platform error boundary — a thrown render error inside the app shell shows
 * this localized RTL screen (with a working retry) instead of Next's default,
 * un-localized error page.
 */
export default function PlatformError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex max-w-[320px] flex-col gap-2">
        <h1 className="text-[20px] font-extrabold text-ink">مشکلی پیش آمد</h1>
        <p className="text-[15px] leading-[1.9] text-muted">
          این صفحه به‌درستی بارگذاری نشد. یک بار دیگر تلاش کنید؛ اگر باز هم
          تکرار شد، کمی بعد سر بزنید.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="md" onClick={reset}>
          تلاش مجدد
        </Button>
        <Link
          href="/market"
          className={buttonClasses({ variant: "ghost", size: "md" })}
        >
          رفتن به بازار
        </Link>
      </div>
    </div>
  );
}
