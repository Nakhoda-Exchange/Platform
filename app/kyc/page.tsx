import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { Logo } from "@/components/layout/logo";
import { KycProgress } from "@/components/kyc/kyc-progress";
import { KycIdentityForm } from "@/components/kyc/kyc-identity-form";

export const metadata: Metadata = {
  title: "احراز هویت | ناخدا",
};

export default function KycPage() {
  return (
    <AuthShell>
      <div className="flex w-full flex-col items-start gap-6">
        <Logo />
        <KycProgress step={1} />
        <div className="flex w-full flex-col gap-2 text-right">
          <h1 className="text-[28px] font-extrabold leading-tight text-ink">
            احراز هویت
          </h1>
          <p className="text-[15px] leading-[1.7] text-muted">
            برای فعال‌سازی حساب، کد ملی و تاریخ تولد خود را وارد کنید.
          </p>
        </div>
      </div>

      <KycIdentityForm />
    </AuthShell>
  );
}
