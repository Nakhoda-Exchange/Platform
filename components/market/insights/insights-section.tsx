import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  CrowdInsights,
  ExitInsights,
  FlowInsights,
  SafetyCheck,
  SafetyInsights,
  StageInsights,
} from "@/lib/core/domain/insights/token-insights";
import { toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";
import {
  ageFa,
  count,
  irt,
  MetricRow,
  mult,
  Panel,
  pct,
  pctFromRatio,
  SourceFootnote,
  Unavailable,
  usd,
} from "./primitives";

const WINDOW_LABEL: Record<string, string> = {
  "5m": "۵ دقیقه",
  "1h": "۱ ساعت",
  "6h": "۶ ساعت",
  "24h": "۲۴ ساعت",
};

function compactToman(v: number): string {
  if (v >= 1_000_000_000)
    return `${toPersianDigits(v / 1_000_000_000)} میلیارد`;
  if (v >= 1_000_000) return `${toPersianDigits(v / 1_000_000)}م`;
  return irt(v);
}

const CHECK_DOT: Record<SafetyCheck["status"], string> = {
  pass: "bg-gain",
  warn: "bg-loss/70",
  fail: "bg-loss",
  unknown: "bg-placeholder",
};

// ── Panel 1: می‌تونم خارج بشم؟ ──────────────────────────────────────────────
function ExitPanel({ exit }: { exit: ExitInsights }) {
  return (
    <Panel title="می‌تونم خارج بشم؟">
      <MetricRow label="نقدینگی" metric={exit.liquidityUsd} render={usd} />
      <MetricRow
        label="نسبت نقدینگی به ارزش بازار"
        metric={exit.liquidityToMcap}
        render={pctFromRatio}
      />
      <MetricRow
        label="قفل نقدینگی"
        metric={exit.lp}
        render={(lp) =>
          lp.lockedPercent != null
            ? `${pct(lp.lockedPercent)} قفل/سوزانده`
            : "نامشخص"
        }
      />
      <div className="border-t border-line pt-2.5">
        <span className="text-[12px] text-muted">اثر بر قیمت در فروش</span>
        {exit.priceImpact.status === "unavailable" ||
        exit.priceImpact.value == null ? (
          <div className="mt-1">
            <Unavailable />
          </div>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1">
            {exit.priceImpact.value.map((p) => (
              <li
                key={p.sizeIrt}
                className="flex items-baseline justify-between text-[13px]"
              >
                <span className="text-muted">
                  {compactToman(p.sizeIrt)} تومان
                </span>
                <span dir="ltr" className="font-bold tabular-nums text-loss">
                  −{pct(p.impactPercent)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SourceFootnote metrics={[exit.liquidityUsd, exit.lp]} />
    </Panel>
  );
}

// ── Panel 2: ریسک کلاهبرداری (explainable checklist) ─────────────────────────
function SafetyPanel({ safety }: { safety: SafetyInsights }) {
  if (safety.checks.length === 0) {
    return (
      <Panel title="ریسک کلاهبرداری">
        <Unavailable />
      </Panel>
    );
  }
  const fails = safety.failCount.value ?? 0;
  const warns = safety.warnCount.value ?? 0;
  return (
    <Panel
      title="ریسک کلاهبرداری"
      subtitle={
        fails + warns > 0
          ? `${toPersianDigits(fails)} خطر · ${toPersianDigits(warns)} هشدار`
          : "بدون خطر شناخته‌شده"
      }
    >
      <ul className="flex flex-col gap-2.5">
        {safety.checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                CHECK_DOT[c.status],
              )}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col">
              <span className="text-[13px] font-bold text-ink">{c.label}</span>
              {c.detail ? (
                <span className="text-[12px] leading-6 text-muted">
                  {c.detail}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <SourceFootnote metrics={[safety.failCount]} />
    </Panel>
  );
}

// ── Panel 3: زود رسیدم یا دیر؟ ───────────────────────────────────────────────
function StagePanel({ stage }: { stage: StageInsights }) {
  return (
    <Panel title="زود رسیدم یا دیر؟">
      <MetricRow label="عمر" metric={stage.ageMs} render={ageFa} />
      <MetricRow label="ارزش بازار" metric={stage.marketCapUsd} render={usd} />
      <MetricRow
        label="ارزش بازار به ارزش کامل رقیق‌شده"
        metric={stage.mcapToFdv}
        render={pctFromRatio}
      />
      <MetricRow
        label="افت از سقف"
        metric={stage.athDrawdownPercent}
        render={(v) => `−${pct(v)}`}
        tone="loss"
      />
      <MetricRow
        label="روند دارندگان (۲۴ ساعت)"
        metric={stage.holderTrend}
        render={(t) =>
          t.delta24hPercent != null
            ? `${count(t.current)} (${t.delta24hPercent >= 0 ? "+" : "−"}${pct(Math.abs(t.delta24hPercent))})`
            : count(t.current)
        }
      />
      <SourceFootnote metrics={[stage.marketCapUsd, stage.holderTrend]} />
    </Panel>
  );
}

// ── Panel 4: حجم واقعیه؟ ─────────────────────────────────────────────────────
function FlowPanel({ flow }: { flow: FlowInsights }) {
  return (
    <Panel title="حجم واقعیه؟">
      <MetricRow
        label="نسبت حجم به نقدینگی"
        metric={flow.volumeToLiquidity}
        render={mult}
      />
      <div className="border-t border-line pt-2.5">
        <span className="text-[12px] text-muted">
          خریداران یکتا در برابر فروشندگان
        </span>
        {flow.windows.status === "unavailable" || flow.windows.value == null ? (
          <div className="mt-1">
            <Unavailable />
          </div>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1">
            {flow.windows.value.map((w) => (
              <li
                key={w.window}
                className="flex items-baseline justify-between text-[13px]"
              >
                <span className="text-muted">{WINDOW_LABEL[w.window]}</span>
                <span dir="ltr" className="tabular-nums">
                  <span className="font-bold text-gain">
                    {toPersianDigits(w.uniqueBuyers)}
                  </span>
                  <span className="text-placeholder"> / </span>
                  <span className="font-bold text-loss">
                    {toPersianDigits(w.uniqueSellers)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SourceFootnote metrics={[flow.volumeToLiquidity, flow.windows]} />
    </Panel>
  );
}

// ── Panel 5: جمعیت چه می‌کنه؟ ────────────────────────────────────────────────
function CrowdPanel({ crowd }: { crowd: CrowdInsights }) {
  return (
    <Panel title="جمعیت چه می‌کنه؟">
      <MetricRow
        label="سهم ۱۰ دارنده‌ی بزرگ (بدون استخر/سوخته)"
        metric={crowd.top10Percent}
        render={pct}
      />
      <MetricRow
        label="سهم اسنایپرها"
        metric={crowd.sniperSharePercent}
        render={pct}
      />
      <div className="border-t border-line pt-2.5">
        <span className="mb-1.5 block text-[12px] text-muted">روی ناخدا</span>
        {crowd.nakhoda.status === "unavailable" ||
        crowd.nakhoda.value == null ? (
          <Unavailable />
        ) : (
          <div className="flex flex-col gap-2">
            {crowd.nakhoda.value.holdersInProfitPercent != null ? (
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-muted">دارندگان در سود</span>
                <span dir="ltr" className="font-bold tabular-nums text-gain">
                  {pct(crowd.nakhoda.value.holdersInProfitPercent)}
                </span>
              </div>
            ) : null}
            {crowd.nakhoda.value.buySellRatio != null ? (
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-muted">نسبت خرید به فروش</span>
                <span dir="ltr" className="font-bold tabular-nums text-ink">
                  {mult(crowd.nakhoda.value.buySellRatio)}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <SourceFootnote metrics={[crowd.top10Percent, crowd.nakhoda]} />
    </Panel>
  );
}

/**
 * Async server component: fetches the token insights once and renders the five
 * panels. Wrapped in <Suspense> by the caller so slow providers stream in and
 * never block the chart. Coins without an on-chain identity render nothing.
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

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[16px] font-extrabold text-ink">بررسی توکن</h2>
      <ExitPanel exit={ins.exit} />
      <SafetyPanel safety={ins.safety} />
      <StagePanel stage={ins.stage} />
      <FlowPanel flow={ins.flow} />
      <CrowdPanel crowd={ins.crowd} />
      <p className="px-1 text-[11px] leading-6 text-placeholder">
        این داده‌ها سیگنال‌های اطلاعاتی‌اند، نه توصیه‌ی سرمایه‌گذاری. تصمیم
        معامله با خودِ شماست.
      </p>
    </div>
  );
}
