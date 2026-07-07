import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthHeader } from "@/components/auth/auth-header";
import { ResetTwoStepForm } from "@/components/account/reset-two-step-form";

export const metadata: Metadata = {
  title: "بازنشانی رمز دومرحله‌ای | ناخدا",
};

export default function TwoStepLoginResetPage() {
  // The login status is held in the httpOnly cookie set at the OTP step, so the
  // return trip to the gate needs no status in the URL.
  return (
    <AuthShell>
      <AuthHeader
        title="بازنشانی رمز دومرحله‌ای"
        subtitle="هویت خود را تأیید کنید تا رمز تازه بسازید."
      />
      <ResetTwoStepForm
        doneHref="/login/two-step"
        doneLabel="ورود با رمز تازه"
      />
    </AuthShell>
  );
}
