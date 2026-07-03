import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import { ok, type Result } from "@/lib/core/domain/shared/result";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Canned market data (per-process). Swap for an HTTP adapter in the composition
// root when the backend lands. iconUrl is empty → a brand letter-badge is shown.
const COINS: Coin[] = [
  {
    id: "btc",
    name: "بیت‌کوین",
    symbol: "BTC",
    iconUrl: "",
    priceIrt: 3_900_000_000,
    priceUsd: 65_800,
    change24h: 3.2,
  },
  {
    id: "eth",
    name: "اتریوم",
    symbol: "ETH",
    iconUrl: "",
    priceIrt: 210_000_000,
    priceUsd: 3_500,
    change24h: 2.8,
  },
  {
    id: "usdt",
    name: "تتر",
    symbol: "USDT",
    iconUrl: "",
    priceIrt: 59_800,
    priceUsd: 1,
    change24h: 0.1,
  },
  {
    id: "sol",
    name: "سولانا",
    symbol: "SOL",
    iconUrl: "",
    priceIrt: 8_300_000,
    priceUsd: 138,
    change24h: -1.4,
  },
  {
    id: "ton",
    name: "تون‌کوین",
    symbol: "TON",
    iconUrl: "",
    priceIrt: 320_000,
    priceUsd: 5.3,
    change24h: 5.3,
  },
  {
    id: "doge",
    name: "دوج‌کوین",
    symbol: "DOGE",
    iconUrl: "",
    priceIrt: 4_500,
    priceUsd: 0.07,
    change24h: -2.1,
  },
];

export class MockMarketRepository implements MarketRepository {
  async listCoins(): Promise<Result<Coin[]>> {
    await delay();
    return ok(COINS);
  }
}
