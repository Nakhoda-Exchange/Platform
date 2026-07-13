# Token Insights — Implementation flow

Product context: [`PRD.md`](./PRD.md) · Contracts: [`api.md`](./api.md).

## Flow

```
PDP (/market/[symbol]) ── GetTokenInsightsUseCase.execute(coin)
   │   coin.token? ── no ─▶ NOT_ONCHAIN  ▶ panels render «قابل اعمال نیست»
   │              └─ yes ─▶ derive usdToIrt = priceIrt/priceUsd
   ▼
TokenInsightsService.getInsights(token, usdToIrt)
   │  route by token.chain → capability providers, fetched in PARALLEL,
   │  each through the per-capability TTL cache (serve-last-good on failure)
   │     marketStats · safety · holders · flow · nakhoda
   ▼
   assemble: run domain math (metrics.ts) over the snapshots →
   one TokenInsights, every field a Metric<T> {value,status,source,lastUpdatedAt}
   ▼
UI: 5 panels, each its own <Suspense> — slow providers never block the chart;
    unavailable metrics show «در دسترس نیست»; stale metrics show a stale badge.
   ▼
InsightsLive ("use client", seeded with the RSC's TokenInsights) ── every 30s
   while the tab is visible, plus once on regaining visibility ──▶
   GET /api/insights/{chain}/{address}?usdToIrt= ── same TokenInsightsPort +
   per-capability cache, no forked logic ── on failure: keep last rendered
   data, no toast, panels never blank.
```

## Where the math lives

Derived values are pure domain functions in
`lib/core/domain/insights/metrics.ts` (unit-tested), called by the service —
never in a provider or a component:

- `liquidityToMcap`, `volumeToLiquidity`, `mcapToFdv`
- `top10PercentExcludingLpBurn` (chain-aware address casing)
- `holderDeltaPercent`, `uniqueWalletCounts`, `sniperSharePercent`
- `priceImpactCurve` (constant-product, currency-invariant)

## Degradation

- Provider down / 429 → that capability's Result fails → its metrics become
  `unavailable` (or `stale` if a last-good cached value exists). Other panels
  are untouched. Nothing is fabricated.
- No key for a key-gated provider → the provider isn't wired for that chain →
  those metrics are `unavailable` until the key lands (config, not code).
