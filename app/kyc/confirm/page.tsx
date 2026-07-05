import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Logo } from "@/components/layout/logo";
import { KycProgress } from "@/components/kyc/kyc-progress";
import { KycConfirmForm } from "@/components/kyc/kyc-confirm-form";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { KYC_PENDING_COOKIE } from "@/app/actions/kyc-state";

export const metadata: Metadata = {
  title: "تأیید اطلاعات هویتی | ناخدا",
};

export default async function KycConfirmPage() {
  // The identity lives server-side; the cookie only carries an opaque id.
  const pendingId = (await cookies()).get(KYC_PENDING_COOKIE)?.value;
  if (!pendingId) redirect("/kyc");

  const identity = await container
    .resolve(TOKENS.KycSessionStore)
    .get(pendingId);
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
            اطلاعات زیر از سامانه استعلام دریافت شد. در صورت درستی، تأیید کنید.
          </p>
        </div>
      </div>

      <KycConfirmForm identity={identity} />
    </AuthShell>
  );
}
