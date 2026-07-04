import type {
  PortfolioRepository,
  PortfolioSnapshot,
} from "@/lib/core/application/portfolio/ports/portfolio-repository.port";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import { ok, type Result } from "@/lib/core/domain/shared/result";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Canned holdings (per-process). Swap for an HTTP adapter in the composition
// root when the backend lands. Set HOLDINGS = [] to preview the empty state.
const HOLDINGS: Holding[] = [
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
];

export class MockPortfolioRepository implements PortfolioRepository {
  async getPortfolio(): Promise<Result<PortfolioSnapshot>> {
    await delay();
    const totalValueIrt = HOLDINGS.reduce((sum, h) => sum + h.valueIrt, 0);
    return ok({ totalValueIrt, holdings: HOLDINGS });
  }
}
