import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { ReferralScreen } from "@/components/referral/referral-screen";

export const metadata: Metadata = {
  title: "کد دعوت | ناخدا",
};

export default async function ReferralPage() {
  const result = await container
    .resolve(TOKENS.GetReferralOverviewUseCase)
    .execute();

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری کد دعوت ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <ReferralScreen overview={result.data} />
    </div>
  );
}
