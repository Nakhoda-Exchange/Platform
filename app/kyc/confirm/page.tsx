import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Logo } from "@/components/layout/logo";
import { KycProgress } from "@/components/kyc/kyc-progress";
import { KycConfirmForm } from "@/components/kyc/kyc-confirm-form";
import { KYC_PENDING_COOKIE, decodeIdentity } from "@/app/actions/kyc-state";

export const metadata: Metadata = {
  title: "تأیید اطلاعات هویتی | ناخدا",
};

export default async function KycConfirmPage() {
  // The identity rides in an httpOnly cookie (base64 JSON), not the URL.
  const pending = (await cookies()).get(KYC_PENDING_COOKIE)?.value;
  const identity = pending ? decodeIdentity(pending) : null;
  if (!identity) redirect("/kyc");

  return (
    <AuthShell>
      <div className="flex w-full flex-col items-start gap-6">
        <Logo />
        <KycProgress step={2} />
        <div className="flex w-full flex-col gap-2 text-right">
          <h1 className="text-[28px] font-extrabold leading-tight text-ink">
            تأیید اطلاعات هویتی
          </h1>
          <p className="text-[15px] leading-[1.7] text-muted">
            اطلاعات زیر از سامانه استعلام دریافت شد. در صورت درستی تأیید کنید تا
            حساب شما فعال شود و وارد بازار شوید.
          </p>
        </div>
      </div>

      <KycConfirmForm identity={identity} />
    </AuthShell>
  );
}
