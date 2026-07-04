import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { formatIrtShort, formatMarketCap } from "@/lib/utils/money";

/** 2×2 grid of market stats for the coin detail page. */
export function CoinStats({ detail }: { detail: CoinDetail }) {
  const stats = [
    { label: "بیشترین ۲۴ ساعت", value: formatIrtShort(detail.high24h) },
    { label: "کمترین ۲۴ ساعت", value: formatIrtShort(detail.low24h) },
    { label: "ارزش بازار", value: formatMarketCap(detail.coin.marketCap) },
    { label: "حجم ۲۴ ساعت", value: formatMarketCap(detail.volume24h) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col gap-1 rounded-card bg-surface p-4"
        >
          <dt className="text-[13px] text-muted">{s.label}</dt>
          <dd className="text-[15px] font-bold text-ink" dir="ltr">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
