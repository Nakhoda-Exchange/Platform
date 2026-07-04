import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { IrtWithdrawForm } from "@/components/wallet/irt-withdraw-form";
import { CryptoWithdrawForm } from "@/components/wallet/crypto-withdraw-form";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "برداشت | ناخدا",
};

export default async function WithdrawPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string }>;
}) {
  const { method } = await searchParams;
  const crypto = method === "crypto";

  const tab = (selected: boolean) =>
    cn(
      "flex h-11 flex-1 items-center justify-center rounded-full text-[15px] font-bold transition-colors",
      selected ? "bg-brand text-white" : "text-muted hover:text-ink",
    );

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <nav
        aria-label="روش برداشت"
        className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1"
      >
        <Link href="/wallet/withdraw" className={tab(!crypto)}>
          تومان
        </Link>
        <Link href="/wallet/withdraw?method=crypto" className={tab(crypto)}>
          رمزارز
        </Link>
      </nav>

      {crypto ? <CryptoWithdraw /> : <IrtWithdraw />}
    </div>
  );
}

/** Server wrapper: cards + cash balance feed the Toman form. */
async function IrtWithdraw() {
  const [cards, balances] = await Promise.all([
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.WithdrawUseCase).balances(),
  ]);
  return (
    <IrtWithdrawForm
      initialCards={cards.ok ? cards.data : []}
      availableIrt={balances.ok ? balances.data.availableIrt : 0}
    />
  );
}

/** Server wrapper: holdings + network fees feed the crypto form. */
async function CryptoWithdraw() {
  const [portfolio, fees] = await Promise.all([
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
    container.resolve(TOKENS.WithdrawUseCase).fees(),
  ]);
  return (
    <CryptoWithdrawForm
      holdings={portfolio.ok ? portfolio.data.holdings : []}
      fees={fees.ok ? fees.data : {}}
    />
  );
}
