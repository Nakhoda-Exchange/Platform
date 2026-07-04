import type { Coin } from "@/lib/core/domain/market/coin";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import type { TradeSide } from "@/lib/core/domain/trade/order";

/**
 * Shared in-memory wallet for the mock adapters (per-process, like all mocks):
 * the portfolio mock reads it, the trade mock settles orders against it — so a
 * mock buy/sell immediately shows up on the Holdings screen.
 */
export interface MockWallet {
  irt: number; // cash balance, Toman
  holdings: Holding[];
}

// Values consistent with mock-market prices (amount × priceIrt = valueIrt).
export const wallet: MockWallet = {
  irt: 250_000_000,
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
};

/** Settles an executed order against the wallet (balance checks already done). */
export function settleTrade(
  coin: Coin,
  side: TradeSide,
  amountCoin: number,
  totalIrt: number,
): void {
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
    wallet.irt += totalIrt;
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
