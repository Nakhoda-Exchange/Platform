import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { IrtWithdrawForm } from "@/components/wallet/irt-withdraw-form";

export const metadata: Metadata = {
  title: "برداشت | ناخدا",
};

export default async function WithdrawPage() {
  const [ibans, cards, balances] = await Promise.all([
    container.resolve(TOKENS.ManageIbansUseCase).list(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.WithdrawUseCase).balances(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <IrtWithdrawForm
        initialIbans={ibans.ok ? ibans.data : []}
        cards={cards.ok ? cards.data : []}
        availableIrt={balances.ok ? balances.data.availableIrt : 0}
      />
    </div>
  );
}
