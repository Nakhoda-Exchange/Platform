import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthHeader } from "@/components/auth/auth-header";
import { OtpVerifyForm } from "@/components/auth/otp-verify-form";
import { EditIcon } from "@/components/ui/icons";
import { maskMobile } from "@/lib/utils/digits";
import { readLoginChallenge } from "@/app/actions/login-flow-state";

export const metadata: Metadata = {
  title: "تأیید شماره موبایل | ناخدا",
};

export default async function VerifyPage() {
  // The challenge lives in an httpOnly cookie, not the URL. No cookie means the
  // user landed here directly (or it expired) — send them back to start.
  const challenge = await readLoginChallenge();
  if (!challenge) redirect("/login");

  return (
    <AuthShell>
      <AuthHeader
        title="تأیید شماره موبایل"
        subtitle={
          <div className="flex w-full flex-col items-start gap-1 text-right">
            <p className="text-[16px] leading-[1.6] text-muted">
              کد ۶ رقمی ارسال‌شده به شماره زیر را وارد کنید.
            </p>
            <div className="flex items-center gap-2">
              <span dir="ltr" className="text-[16px] font-semibold text-ink">
                {maskMobile(challenge.phone)}
              </span>
              <Link
                href="/login"
                aria-label="ویرایش شماره موبایل"
                className="text-brand transition-colors hover:text-brand/80"
              >
                <EditIcon size={16} />
              </Link>
            </div>
          </div>
        }
      />

      <OtpVerifyForm phone={challenge.phone} resendSeconds={challenge.rs} />
    </AuthShell>
  );
}
