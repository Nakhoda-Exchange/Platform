# Token Insights — Product Requirements (PRD)

## Summary

The PDP is the DECISION surface for a meme coin. Meme coins have no
fundamentals, so a normalized, provider-agnostic data layer (`TokenInsights`)
answers the five questions a trader actually has, each as its own panel:

1. **می‌تونم خارج بشم؟** — liquidity, liquidity÷mcap, price impact, LP locked/burned.
2. **ریسک کلاهبرداری** — an EXPLAINABLE safety checklist (authorities, taxes,
   concentration, snipers) with per-check pass/warn/fail + source.
3. **زود رسیدم یا دیر؟** — age, mcap÷FDV, ATH drawdown, holder-count trend.
4. **حجم واقعیه؟** — volume÷liquidity (wash signal), unique buyers vs sellers per
   window, trade-size distribution.
5. **جمعیت چه می‌کنه؟** — top holders, sniper share, and Nakhoda-native metrics
   from our own order flow.

## Goals

- ONE normalized shape regardless of chain or provider; UI never knows a
  provider name (only a `source` label for attribution).
- Graceful degradation: a down/rate-limited provider degrades ITS metric to
  «در دسترس نیست» — never fabricated or interpolated, never blocks the page.
- Signals with context, never advice or a verdict. No single green tick;
  the safety panel shows which checks passed/failed and why.
- Every metric carries `lastUpdatedAt` + `source`; stale data is marked stale.

## Derived metrics (our own math, not proxied)

liquidity÷mcap · volume÷liquidity · top-10 % **excluding LP pools + burn
addresses** · holder-count delta (24h/7d) · **unique wallets** buyers/sellers
(not tx counts) · sniper supply share · price impact at representative Toman
sizes · % of Nakhoda holders in profit · our buy/sell ratio · watchlist velocity.

## Non-goals (this tier)

- Live buy-box-sized price impact (PDP shows representative sizes; the trade
  screen wires the typed amount as a follow-up).
- Cross-instance shared cache (per-instance TTL cache for now).
- Majors (BTC/ETH): no on-chain identity → panels show «قابل اعمال نیست».
