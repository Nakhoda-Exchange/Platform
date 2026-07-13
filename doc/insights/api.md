# Token Insights — contracts

Port: `lib/core/application/insights/ports/insights.port.ts` ·
Service: `lib/infrastructure/insights/token-insights.service.ts` ·
Providers: `lib/infrastructure/insights/providers/` ·
Adding a provider: [`providers.md`](./providers.md)

Unlike other features, insights has no single backend endpoint: the service
composes external on-chain providers server-side. There is no mock/HTTP split —
providers are always real and fail soft to `unavailable` without a key.

## Normalized output — `TokenInsights`

`lib/core/domain/insights/token-insights.ts`. Every value is a `Metric<T>`:

```ts
Metric<T> = {
  value: T | null,
  status: "ok" | "stale" | "unavailable",
  source:
    "dexscreener" |
    "birdeye" |
    "rugcheck" |
    "helius" |
    "moralis" |
    "goplus" |
    "nakhoda" |
    "derived",
  lastUpdatedAt: number | null, // epoch ms of the underlying fetch
};
```

Groups: `exit` (liquidity, liquidity÷mcap, LP, priceImpact) · `safety`
(explainable `checks[]` + fail/warn counts) · `stage` (age, mcap, fdv,
mcap÷fdv, ATH drawdown, holderTrend) · `flow` (volume÷liquidity, per-window
unique buyers/sellers, trade-size distribution) · `crowd` (topHolders, top-10 %
excl. LP+burn, sniper share, `nakhoda`).

## Capability providers (chain → provider routing)

Providers are split by CAPABILITY so each is swappable; the service routes by
`token.chain`.

| Capability  | Solana                    | EVM (eth/bsc/base) | Key       |
| ----------- | ------------------------- | ------------------ | --------- |
| MarketStats | DexScreener               | DexScreener        | keyless   |
| Safety      | RugCheck.xyz              | GoPlus Security    | keyless\* |
| Holders     | Birdeye / Helius          | Moralis            | key       |
| TradeFlow   | Birdeye / Helius          | Moralis            | key       |
| NakhodaFlow | our own order flow (both) | —                  | —         |

\* GoPlus works keyless at low rate; an app key raises limits.

### External endpoints

- DexScreener — `GET https://api.dexscreener.com/latest/dex/tokens/{address}`
- RugCheck — `GET https://api.rugcheck.xyz/v1/tokens/{mint}/report`
- GoPlus — `GET https://api.goplus.io/api/v1/token_security/{chainId}?contract_addresses={addr}`
- Birdeye — `https://public-api.birdeye.so/…` (header `X-API-KEY`, `x-chain`)
- Moralis — `https://deep-index.moralis.io/api/v2.2/…` (header `X-API-Key`)
- Helius — `https://api.helius.xyz/v0/…?api-key=…`

## Caching (per-capability TTL)

`lib/infrastructure/insights/cache.ts`. Not one blanket TTL:

| Capability  | TTL    |
| ----------- | ------ |
| marketStats | 10s    |
| flow        | 45s    |
| holders     | 3 min  |
| safety      | 12 min |
| nakhoda     | 30s    |

On a fetch failure the last-good value is served marked `stale`; only a total
absence of data yields `unavailable`.

## Env (server-only — never `NEXT_PUBLIC_`)

See `.env.example`: `BIRDEYE_API_KEY`, `HELIUS_API_KEY`, `MORALIS_API_KEY`,
`GOPLUS_APP_KEY`, `GOPLUS_APP_SECRET`.
