import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { BiometricScreen } from "@/components/account/biometric-screen";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "ورود بیومتریک | ناخدا",
};

export default async function BiometricPage() {
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

  // Biometric is an ALTERNATIVE unlock for the two-step gate — without a
  // two-step password there is no gate to unlock, so send the user there.
  if (!result.data.twoFactorEnabled) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-[320px] text-[16px] leading-8 text-muted">
          برای ورود بیومتریک، اول باید رمز دومرحله‌ای داشته باشید. بیومتریک
          جایگزین تایپ همان رمز هنگام ورود می‌شود.
        </p>
        <Link
          href="/account/two-step"
          className={buttonClasses({
            size: "lg",
            fullWidth: true,
            className: "max-w-[360px]",
          })}
        >
          تنظیم رمز دومرحله‌ای
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <BiometricScreen userName={result.data.name} />
    </div>
  );
}
