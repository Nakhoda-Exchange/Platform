import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { BankAccountsManager } from "@/components/account/bank-accounts-manager";

export const metadata: Metadata = {
  title: "حساب‌های بانکی | ناخدا",
};

export default async function BankAccountsPage() {
  const [profile, cards, ibans] = await Promise.all([
    container.resolve(TOKENS.GetProfileUseCase).execute(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.ManageIbansUseCase).list(),
  ]);

  if (!profile.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری حساب‌های بانکی ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <BankAccountsManager
        kycVerified={profile.data.kycVerified}
        initialCards={cards.ok ? cards.data : []}
        initialIbans={ibans.ok ? ibans.data : []}
      />
    </div>
  );
}
