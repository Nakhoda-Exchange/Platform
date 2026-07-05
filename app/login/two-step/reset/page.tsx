import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthHeader } from "@/components/auth/auth-header";
import { ResetTwoStepForm } from "@/components/account/reset-two-step-form";

export const metadata: Metadata = {
  title: "بازنشانی رمز دومرحله‌ای | ناخدا",
};

export default async function TwoStepLoginResetPage({
  searchParams,
}: {
  searchParams: Promise<{ st?: string }>;
}) {
  const { st = "registration" } = await searchParams;

  return (
    <AuthShell>
      <AuthHeader
        title="بازنشانی رمز دومرحله‌ای"
        subtitle="هویت خود را تأیید کنید تا رمز تازه بسازید."
      />
      <ResetTwoStepForm
        doneHref={`/login/two-step?st=${encodeURIComponent(st)}`}
        doneLabel="ورود با رمز تازه"
      />
    </AuthShell>
  );
}
