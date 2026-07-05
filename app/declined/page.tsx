import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "احراز هویت ناموفق | ناخدا",
};

/**
 * Dead end for declined users — no site chrome, no market. Just a centered
 * retry-KYC button. A declined user must never reach the platform.
 */
export default function DeclinedPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-paper px-6 text-center">
      <p className="max-w-[300px] text-[15px] leading-[1.9] text-muted">
        احراز هویت شما تأیید نشد.
      </p>
      <Link
        href="/kyc"
        className={buttonClasses({ size: "xl", shape: "rounded" })}
      >
        تلاش مجدد احراز هویت
      </Link>
    </main>
  );
}
