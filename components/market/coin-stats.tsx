import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { formatIrtShort, formatMarketCap } from "@/lib/utils/money";

/**
 * Market stats for the coin detail page, in one inset card matching the
 * chart card above it: a 24h range gauge (where the price sits between the
 * day's low and high — low on the left, high on the right, matching the
 * chart's LTR flow) and label/value rows. Values render in natural RTL —
 * no forced dir, which used to bidi-scramble mixed digit/«ت» strings.
 */
export function CoinStats({ detail }: { detail: CoinDetail }) {
  const span = detail.high24h - detail.low24h;
  const position =
    span > 0
      ? Math.min(
          100,
          Math.max(0, ((detail.coin.priceIrt - detail.low24h) / span) * 100),
        )
      : 50;

  const rows = [
    { label: "حجم ۲۴ ساعت", value: formatMarketCap(detail.volume24h) },
    { label: "ارزش بازار", value: formatMarketCap(detail.coin.marketCap) },
  ];

  return (
    <section aria-label="آمار بازار" className="flex flex-col gap-2">
      <h2 className="text-[16px] font-bold text-ink">آمار بازار</h2>
      <div className="flex flex-col rounded-card bg-surface p-4">
        {/* 24h range gauge: the current price between the day's low and high. */}
        <div className="flex flex-col gap-3 border-b border-line pb-4">
          <div
            dir="ltr"
            role="img"
            aria-label="جایگاه قیمت فعلی در دامنه ۲۴ ساعت"
            className="relative h-1.5 rounded-full bg-line"
          >
            <span
              aria-hidden
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-paper bg-brand shadow-sm"
              style={{ left: `${position}%` }}
            />
          </div>
          <div className="flex justify-between gap-3 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted">بیشترین ۲۴ ساعت</span>
              <span className="font-bold text-ink">
                {formatIrtShort(detail.high24h)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-left">
              <span className="text-muted">کمترین ۲۴ ساعت</span>
              <span className="font-bold text-ink">
                {formatIrtShort(detail.low24h)}
              </span>
            </div>
          </div>
        </div>

        <dl className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-line py-3.5 last:border-0 last:pb-0"
            >
              <dt className="text-[15px] text-muted">{row.label}</dt>
              <dd className="text-[15px] font-bold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
