import type { Coin } from "@/lib/core/domain/market/coin";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import type { TradeSide } from "@/lib/core/domain/trade/order";
import type { Transaction } from "@/lib/core/domain/wallet/transaction";

/**
 * Shared in-memory wallet for the mock adapters (per-process, like all mocks):
 * the portfolio mock reads it, the trade mock settles orders against it, and
 * the transactions mock lists its history — so a mock buy/sell immediately
 * shows up on the Holdings screen AND in the history timeline.
 */
export interface MockWallet {
  irt: number; // cash balance, Toman
  platformFeesIrt: number; // fees the house collected (the referral pool)
  holdings: Holding[];
  transactions: Transaction[];
}

/** Minutes/days ago → Date, for seeding a believable timeline. */
const ago = (days: number, minutes = 0) =>
  new Date(Date.now() - days * 86_400_000 - minutes * 60_000);

// Values consistent with mock-market prices (amount × priceIrt = valueIrt).
export const wallet: MockWallet = {
  irt: 250_000_000,
  platformFeesIrt: 0,
  holdings: [
    {
      coin: {
        id: "btc",
        name: "بیت‌کوین",
        symbol: "BTC",
        iconUrl: "/coins/btc.png",
        change24h: 3.2,
      },
      amount: 0.0015,
      valueIrt: 5_850_000,
    },
    {
      coin: {
        id: "eth",
        name: "اتریوم",
        symbol: "ETH",
        iconUrl: "/coins/eth.png",
        change24h: 2.8,
      },
      amount: 0.02,
      valueIrt: 4_200_000,
    },
    {
      coin: {
        id: "ton",
        name: "تون‌کوین",
        symbol: "TON",
        iconUrl: "/coins/ton.png",
        change24h: 36.7,
      },
      amount: 5,
      valueIrt: 1_600_000,
    },
    {
      coin: {
        id: "sol",
        name: "سولانا",
        symbol: "SOL",
        iconUrl: "/coins/sol.png",
        change24h: 14.5,
      },
      amount: 0.1,
      valueIrt: 830_000,
    },
    {
      coin: {
        id: "usdt",
        name: "تتر",
        symbol: "USDT",
        iconUrl: "/coins/usdt.png",
        change24h: 0.1,
      },
      amount: 6,
      valueIrt: 358_800,
    },
  ],
  // Seeded history (newest first not required — the use case sorts).
  transactions: [
    {
      id: "t-1",
      type: "buy",
      status: "done",
      at: ago(0, 130),
      amountIrt: 1_600_000,
      symbol: "TON",
      coinName: "تون‌کوین",
      amountCoin: 5,
      iconUrl: "/coins/ton.png",
    },
    {
      id: "t-2",
      type: "withdraw",
      status: "pending",
      at: ago(0, 45),
      amountIrt: 20_000_000,
    },
    {
      id: "t-3",
      type: "deposit",
      status: "done",
      at: ago(1, 300),
      amountIrt: 50_000_000,
    },
    {
      id: "t-4",
      type: "sell",
      status: "done",
      at: ago(1, 520),
      amountIrt: 4_150_000,
      symbol: "SOL",
      coinName: "سولانا",
      amountCoin: 0.5,
      iconUrl: "/coins/sol.png",
    },
    {
      id: "t-5",
      type: "withdraw",
      status: "failed",
      at: ago(3, 200),
      amountIrt: 8_000_000,
    },
    {
      id: "t-6",
      type: "buy",
      status: "done",
      at: ago(6, 80),
      amountIrt: 5_850_000,
      symbol: "BTC",
      coinName: "بیت‌کوین",
      amountCoin: 0.0015,
      iconUrl: "/coins/btc.png",
    },
    {
      id: "t-7",
      type: "deposit",
      status: "done",
      at: ago(9, 60),
      amountIrt: 220_000_000,
    },
    // Referral rewards — the fee share invitees generated (doc/referral).
    {
      id: "r-1",
      type: "reward",
      status: "done",
      at: ago(2, 90),
      amountIrt: 450_000,
    },
    {
      id: "r-2",
      type: "reward",
      status: "done",
      at: ago(8, 30),
      amountIrt: 230_000,
    },
  ],
};

/** Settles an executed order against the wallet (balance checks already done). */
export function settleTrade(
  coin: Coin,
  side: TradeSide,
  amountCoin: number,
  totalIrt: number,
  feeIrt: number,
): void {
  wallet.platformFeesIrt += feeIrt;
  wallet.transactions.push({
    id: crypto.randomUUID(),
    type: side,
    status: "done",
    at: new Date(),
    amountIrt: totalIrt,
    symbol: coin.symbol,
    coinName: coin.name,
    amountCoin,
    iconUrl: coin.iconUrl,
  });
  const held = wallet.holdings.find((h) => h.coin.id === coin.id);
  if (side === "buy") {
    wallet.irt -= totalIrt;
    if (held) {
      held.amount += amountCoin;
      held.valueIrt = Math.round(held.amount * coin.priceIrt);
    } else {
      wallet.holdings.push({
        coin: {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          iconUrl: coin.iconUrl,
          change24h: coin.change24h,
        },
        amount: amountCoin,
        valueIrt: Math.round(totalIrt),
      });
    }
  } else {
    wallet.irt += totalIrt - feeIrt; // seller receives net of fee
    if (held) {
      held.amount -= amountCoin;
      if (held.amount <= 1e-9) {
        wallet.holdings.splice(wallet.holdings.indexOf(held), 1);
      } else {
        held.valueIrt = Math.round(held.amount * coin.priceIrt);
      }
    }
  }
}
