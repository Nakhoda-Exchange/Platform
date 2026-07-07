import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { formatMarketCap } from "@/lib/utils/money";

const holderFormat = new Intl.NumberFormat("fa-IR");

/**
 * The few numbers worth stating outright on the PDP — market cap, 24h volume,
 * and how many people hold the coin here. The 24h high/low that used to live in
 * «آمار بازار» was redundant with the chart, so it's gone; these three aren't.
 */
export function CoinKeyStats({ detail }: { detail: CoinDetail }) {
  const rows = [
    { label: "ارزش بازار", value: formatMarketCap(detail.coin.marketCap) },
    { label: "حجم ۲۴ ساعت", value: formatMarketCap(detail.volume24h) },
    { label: "دارندگان", value: `${holderFormat.format(detail.holders)} نفر` },
  ];

  return (
    <section aria-label="آمار کلیدی" className="flex flex-col gap-2">
      <h2 className="text-[16px] font-bold text-ink">آمار کلیدی</h2>
      <dl className="flex flex-col rounded-card bg-surface px-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-line py-3.5 last:border-0"
          >
            <dt className="text-[15px] text-muted">{row.label}</dt>
            <dd className="text-[15px] font-bold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
