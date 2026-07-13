import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { Coin } from "@/lib/core/domain/market/coin";
import { InsightsLive } from "./insights-live";

/**
 * Async server component: fetches the token insights once for first paint and
 * hands off to `InsightsLive` (client) for polling refresh. Wrapped in
 * <Suspense> by the caller so slow providers stream in and never block the
 * chart. Coins without an on-chain identity render nothing.
 */
export async function InsightsSection({ coin }: { coin: Coin }) {
  if (!coin.token) return null;

  const result = await container
    .resolve(TOKENS.GetTokenInsightsUseCase)
    .execute(coin);
  if (!result.ok) {
    return (
      <p className="rounded-card border border-line bg-surface p-4 text-center text-[13px] text-muted">
        داده‌ی زنجیره‌ای این رمزارز در دسترس نیست.
      </p>
    );
  }
  const ins = result.data;
  const usdToIrt = coin.priceUsd > 0 ? coin.priceIrt / coin.priceUsd : 0;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[16px] font-extrabold text-ink">بررسی توکن</h2>
      <InsightsLive
        initial={ins}
        chain={coin.token.chain}
        address={coin.token.address}
        usdToIrt={usdToIrt}
      />
      <p className="px-1 text-[11px] leading-6 text-placeholder">
        این داده‌ها سیگنال‌های اطلاعاتی‌اند، نه توصیه‌ی سرمایه‌گذاری. تصمیم
        معامله با خودِ شماست.
      </p>
    </div>
  );
}
