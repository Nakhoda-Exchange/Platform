import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { TwoStepForm } from "@/components/account/two-step-form";

export const metadata: Metadata = {
  title: "ورود دومرحله‌ای | ناخدا",
};

export default async function TwoStepPage() {
  const result = await container.resolve(TOKENS.GetProfileUseCase).execute();

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری تنظیمات ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <TwoStepForm
        enabled={result.data.twoFactorEnabled}
        mobile={result.data.mobile}
      />
    </div>
  );
}
