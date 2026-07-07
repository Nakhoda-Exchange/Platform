import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { IrtDepositForm } from "@/components/wallet/irt-deposit-form";
import { CryptoDepositView } from "@/components/wallet/crypto-deposit-view";
import { CoinIcon } from "@/components/market/coin-icon";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "واریز | ناخدا",
};

export default async function DepositPage({
  searchParams,
}: {
  searchParams: Promise<{ method?: string; coin?: string }>;
}) {
  const { method, coin } = await searchParams;
  const crypto = method === "crypto";
  const coinId = coin ?? "btc";

  const tab = (selected: boolean) =>
    cn(
      "flex h-11 flex-1 items-center justify-center rounded-full text-[15px] font-bold transition-colors",
      selected ? "bg-brand text-white" : "text-muted hover:text-ink",
    );

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      {/* Method tabs as links — the page stays a server component. */}
      <nav
        aria-label="روش واریز"
        className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1"
      >
        <Link href="/wallet/deposit" className={tab(!crypto)}>
          تومان
        </Link>
        <Link href="/wallet/deposit?method=crypto" className={tab(crypto)}>
          رمزارز
        </Link>
      </nav>

      {crypto ? <CryptoDeposit coinId={coinId} /> : <IrtDeposit />}
    </div>
  );
}

/** Server wrapper: the user's saved cards feed the client flow. */
async function IrtDeposit() {
  const [cards, portfolio] = await Promise.all([
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
  ]);
  // A zero Toman balance means this is the user's first (or a fresh) deposit —
  // greet them with a short reassurance instead of a bare form.
  const firstDeposit = !portfolio.ok || portfolio.data.availableIrt <= 0;
  return (
    <IrtDepositForm
      initialCards={cards.ok ? cards.data : []}
      firstDeposit={firstDeposit}
    />
  );
}

/** Coin picker chips + the selected coin's address/QR. */
async function CryptoDeposit({ coinId }: { coinId: string }) {
  const result = await container
    .resolve(TOKENS.GetDepositAddressUseCase)
    .execute(coinId);

  if (!result.ok || !result.data) {
    return (
      <p className="p-6 text-center text-[15px] text-muted">
        بارگذاری آدرس واریز ناموفق بود. دوباره تلاش کنید.
      </p>
    );
  }
  const { coin, deposit } = result.data;

  const coins = await container.resolve(TOKENS.ListCoinsUseCase).execute();
  const list = coins.ok ? coins.data : [coin];

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="انتخاب رمزارز" className="flex gap-2 overflow-x-auto">
        {list.map((c) => (
          <Link
            key={c.id}
            href={`/wallet/deposit?method=crypto&coin=${c.id}`}
            aria-current={c.id === coin.id ? "true" : undefined}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-colors",
              c.id === coin.id
                ? "bg-brand/10 text-brand"
                : "bg-surface text-muted hover:text-ink",
            )}
          >
            <CoinIcon coin={c} size={20} />
            {c.symbol}
          </Link>
        ))}
      </nav>
      <CryptoDepositView coin={coin} deposit={deposit} />
    </div>
  );
}
