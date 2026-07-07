import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthHeader } from "@/components/auth/auth-header";
import { TwoStepLoginForm } from "@/components/auth/two-step-login-form";
import { readLoginStatus } from "@/app/actions/login-flow-state";

export const metadata: Metadata = {
  title: "رمز دومرحله‌ای | ناخدا",
};

export default async function TwoStepLoginPage() {
  // Status + next travel in an httpOnly cookie, not the URL. No cookie means the
  // user reached the gate without passing the OTP step — send them back.
  const pending = await readLoginStatus();
  if (!pending) redirect("/login");

  return (
    <AuthShell>
      <AuthHeader
        title="رمز دومرحله‌ای"
        subtitle="برای ورود، رمز دومرحله‌ای حساب خود را وارد کنید."
      />
      <TwoStepLoginForm />
    </AuthShell>
  );
}
