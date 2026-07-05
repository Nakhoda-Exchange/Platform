import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthHeader } from "@/components/auth/auth-header";
import { TwoStepLoginForm } from "@/components/auth/two-step-login-form";

export const metadata: Metadata = {
  title: "رمز دومرحله‌ای | ناخدا",
};

// Next.js 16: searchParams is async. The status travels in the URL like the
// OTP challenge does — mock-only; a real backend keeps it in the session.
export default async function TwoStepLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ st?: string }>;
}) {
  const { st = "registration" } = await searchParams;

  return (
    <AuthShell>
      <AuthHeader
        title="رمز دومرحله‌ای"
        subtitle="برای ورود، رمز دومرحله‌ای حساب خود را وارد کنید."
      />
      <TwoStepLoginForm status={st} />
    </AuthShell>
  );
}
