import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { IrtDepositForm } from "@/components/wallet/irt-deposit-form";

export const metadata: Metadata = {
  title: "واریز | ناخدا",
};

export default async function DepositPage() {
  // A zero Toman balance means this is a first/fresh deposit — the form
  // greets the user instead of dropping them into a bare form.
  const portfolio = await container
    .resolve(TOKENS.GetPortfolioUseCase)
    .execute();
  const firstDeposit = !portfolio.ok || portfolio.data.availableIrt <= 0;

  const cards = await container.resolve(TOKENS.ManageCardsUseCase).list();

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <IrtDepositForm
        initialCards={cards.ok ? cards.data : []}
        firstDeposit={firstDeposit}
      />
    </div>
  );
}
