import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { SupportLink } from "@/components/support/support-link";

export const metadata: Metadata = {
  title: "بررسی احراز هویت | ناخدا",
};

/**
 * Recovery screen for users whose identity check didn't pass. No site chrome
 * and no platform access, but not a dead end: it explains what happened, what
 * to do next, and offers a retry plus a direct line to support.
 */
export default function DeclinedPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-paper px-6 text-center">
      <div className="flex max-w-[320px] flex-col gap-3">
        <h1 className="text-[22px] font-extrabold text-ink">
          احراز هویت شما تأیید نشد
        </h1>
        <p className="text-[15px] leading-[1.9] text-muted">
          اطلاعاتی که وارد کردید با سامانه استعلام هم‌خوانی نداشت. می‌توانید
          اطلاعات را دوباره و با دقت وارد کنید. اگر مطمئن هستید درست وارد
          کرده‌اید، پشتیبانی کنار شماست تا موضوع را بررسی کند.
        </p>
      </div>

      <div className="flex w-full max-w-[320px] flex-col items-center gap-4">
        <Link
          href="/kyc"
          className={buttonClasses({
            size: "xl",
            shape: "rounded",
            fullWidth: true,
          })}
        >
          تلاش مجدد احراز هویت
        </Link>
        <SupportLink className="text-[15px] font-bold text-brand transition-colors hover:text-brand/80">
          گفتگو با پشتیبانی
        </SupportLink>
      </div>
    </main>
  );
}
