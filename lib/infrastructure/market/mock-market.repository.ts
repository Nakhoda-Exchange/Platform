import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  ChartRange,
  CoinDetail,
  PricePoint,
} from "@/lib/core/domain/market/coin-detail";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import { seededSeries } from "@/lib/infrastructure/shared/seeded-series";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Canned market data (per-process). Swap for an HTTP adapter in the composition
// root when the backend lands. Icons live in public/coins/ (see scripts/generate-coin-icons.mjs).
// marketCap is in همت (هزار میلیارد تومان).
const COINS: Coin[] = [
  {
    id: "btc",
    name: "بیت‌کوین",
    symbol: "BTC",
    iconUrl: "/coins/btc.png",
    priceIrt: 3_900_000_000,
    priceUsd: 65_800,
    change24h: 3.2,
    marketCap: 85_000,
    isNew: false,
  },
  {
    id: "eth",
    name: "اتریوم",
    symbol: "ETH",
    iconUrl: "/coins/eth.png",
    priceIrt: 210_000_000,
    priceUsd: 3_500,
    change24h: 2.8,
    marketCap: 22_000,
    isNew: false,
  },
  {
    id: "usdt",
    name: "تتر",
    symbol: "USDT",
    iconUrl: "/coins/usdt.png",
    priceIrt: 59_800,
    priceUsd: 1,
    change24h: 0.1,
    marketCap: 7_200,
    isNew: false,
  },
  {
    id: "bnb",
    name: "بایننس‌کوین",
    symbol: "BNB",
    iconUrl: "/coins/bnb.png",
    priceIrt: 45_000_000,
    priceUsd: 720,
    change24h: -1.9,
    marketCap: 6_800,
    isNew: false,
  },
  {
    id: "sol",
    name: "سولانا",
    symbol: "SOL",
    iconUrl: "/coins/sol.png",
    priceIrt: 8_300_000,
    priceUsd: 138,
    change24h: 14.5,
    marketCap: 4_100,
    isNew: false,
  },
  {
    id: "xrp",
    name: "ریپل",
    symbol: "XRP",
    iconUrl: "/coins/xrp.png",
    priceIrt: 42_000,
    priceUsd: 0.62,
    change24h: 4.1,
    marketCap: 2_100,
    isNew: false,
  },
  {
    id: "ada",
    name: "کاردانو",
    symbol: "ADA",
    iconUrl: "/coins/ada.png",
    priceIrt: 38_000,
    priceUsd: 0.58,
    change24h: -1.2,
    marketCap: 1_300,
    isNew: false,
  },
  {
    id: "doge",
    name: "دوج‌کوین",
    symbol: "DOGE",
    iconUrl: "/coins/doge.png",
    priceIrt: 4_500,
    priceUsd: 0.07,
    change24h: -2.1,
    marketCap: 850,
    isNew: false,
  },
  {
    id: "ton",
    name: "تون‌کوین",
    symbol: "TON",
    iconUrl: "/coins/ton.png",
    priceIrt: 320_000,
    priceUsd: 5.3,
    change24h: 36.7,
    marketCap: 555,
    isNew: false,
  },
  {
    id: "pepe",
    name: "پپه",
    symbol: "PEPE",
    iconUrl: "/coins/pepe.png",
    priceIrt: 0.18,
    priceUsd: 0.0000028,
    change24h: 9.8,
    marketCap: 93,
    isNew: false,
  },
  {
    id: "wif",
    name: "داگ‌ویف‌هت",
    symbol: "WIF",
    iconUrl: "/coins/wif.png",
    priceIrt: 85_000,
    priceUsd: 1.3,
    change24h: 12.4,
    marketCap: 32,
    isNew: true,
  },
  {
    id: "bome",
    name: "بوم",
    symbol: "BOME",
    iconUrl: "/coins/bome.png",
    priceIrt: 1_200,
    priceUsd: 0.018,
    change24h: 8.7,
    marketCap: 18,
    isNew: true,
  },
  {
    id: "mew",
    name: "میو",
    symbol: "MEW",
    iconUrl: "/coins/mew.png",
    priceIrt: 320,
    priceUsd: 0.005,
    change24h: 15.2,
    marketCap: 9,
    isNew: true,
  },
];

// Short Persian «about» blurbs for the well-known coins; others fall back to a
// generic line. Mock copy — swap for CMS/API content later.
const DESCRIPTIONS: Record<string, string> = {
  btc: "بیت‌کوین نخستین و شناخته‌شده‌ترین رمزارز جهان است که در سال ۲۰۰۹ معرفی شد و پایه‌ی بازار رمزارزها به شمار می‌رود.",
  eth: "اتریوم پلتفرمی برای قراردادهای هوشمند است و بستر بسیاری از پروژه‌های غیرمتمرکز و توکن‌ها روی آن ساخته شده است.",
  usdt: "تتر یک استیبل‌کوین است که ارزش آن به دلار آمریکا وابسته است و برای حفظ ارزش و نقل‌وانتقال سریع کاربرد دارد.",
  sol: "سولانا یک شبکه‌ی بلاک‌چینی سریع و کم‌هزینه است که برای اپلیکیشن‌های غیرمتمرکز و توکن‌های پرکاربرد شناخته می‌شود.",
};

export class MockMarketRepository implements MarketRepository {
  async listCoins(): Promise<Result<Coin[]>> {
    await delay();
    return ok(COINS);
  }

  async getCoinDetail(idOrSymbol: string): Promise<Result<CoinDetail | null>> {
    await delay();
    const key = idOrSymbol.toLowerCase();
    const coin = COINS.find(
      (c) => c.id === key || c.symbol.toLowerCase() === key,
    );
    if (!coin) return ok(null);

    const seed = [...coin.symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
    const d = coin.change24h / 100;
    const end = Date.now();
    const toPoints = (values: number[], stepMs: number): PricePoint[] =>
      values.map((v, i) => ({
        at: end - (values.length - 1 - i) * stepMs,
        priceIrt: v,
      }));
    const series: Record<ChartRange, PricePoint[]> = {
      "24h": toPoints(seededSeries(seed + 1, 24, coin.priceIrt, d), 3_600_000),
      "7d": toPoints(
        seededSeries(seed + 7, 28, coin.priceIrt, d * 1.8),
        21_600_000,
      ),
      "1m": toPoints(
        seededSeries(seed + 30, 30, coin.priceIrt, d * 3),
        86_400_000,
      ),
      "1y": toPoints(
        seededSeries(seed + 365, 24, coin.priceIrt, d * 6),
        1_314_900_000, // ~15.2 days: 24 points spanning a year
      ),
    };
    const prices24 = series["24h"].map((p) => p.priceIrt);

    return ok({
      coin,
      high24h: Math.max(...prices24),
      low24h: Math.min(...prices24),
      volume24h: Math.round(coin.marketCap * 0.6) / 10, // همت, ~6% of market cap
      description:
        DESCRIPTIONS[coin.id] ??
        `${coin.name} (${coin.symbol}) یکی از رمزارزهای قابل معامله در ناخداست. قیمت لحظه‌ای و نمودار آن را اینجا دنبال کنید.`,
      series,
    });
  }
}
