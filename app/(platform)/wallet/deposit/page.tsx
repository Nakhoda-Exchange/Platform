import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { IrtDepositForm } from "@/components/wallet/irt-deposit-form";
import { formatIrt } from "@/lib/utils/money";

export const metadata: Metadata = {
  title: "واریز | ناخدا",
};

export default async function DepositPage() {
  // A zero Toman balance means this is a first/fresh deposit — the form
  // greets the user instead of dropping them into a bare form.
  const portfolio = await container
    .resolve(TOKENS.GetPortfolioUseCase)
    .execute();
  const availableIrt = portfolio.ok ? portfolio.data.availableIrt : 0;
  const firstDeposit = availableIrt <= 0;

  const cards = await container.resolve(TOKENS.ManageCardsUseCase).list();

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      {availableIrt > 0 ? (
        // Current spendable balance, so the user sees what they're adding to.
        <div className="flex items-center justify-between rounded-card bg-surface px-4 py-3.5">
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-[16px] font-extrabold text-white"
            >
              ت
            </span>
            <span className="text-[14px] text-muted">موجودی فعلی</span>
          </span>
          <span dir="ltr" className="text-[15px] font-extrabold text-ink">
            {formatIrt(availableIrt)}
          </span>
        </div>
      ) : null}

      <IrtDepositForm
        initialCards={cards.ok ? cards.data : []}
        firstDeposit={firstDeposit}
      />
    </div>
  );
}
