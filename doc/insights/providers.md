# Adding a provider adapter

Providers are split by CAPABILITY, not by vendor, so a new source plugs into
one capability without touching the rest. Steps:

1. **Implement the capability interface** in
   `lib/infrastructure/insights/providers/<vendor>.provider.ts`. Interfaces live
   in `lib/core/application/insights/ports/insights.port.ts`:
   `MarketStatsProvider` · `SafetyProvider` · `HoldersProvider` ·
   `TradeFlowProvider` · `NakhodaFlowProvider`. Return the raw `*Snapshot` for
   that capability — the SERVICE runs the derived math, not the provider.

2. **Keep the DTO mapping pure and exported** (e.g. `mapDexScreenerStats`) and
   colocate a `*.provider.test.ts` with a real-response fixture. Never mutate
   or lose fields; a value we can't get is `null`, never invented.

3. **Fetch via** `./fetch-json` (server-side, timeout + 429 aware). Read the key
   from `process.env` — server-only, never `NEXT_PUBLIC_`. Add it to
   `.env.example` and the table in [`api.md`](./api.md).

4. **Route it** in the composition root
   (`lib/di/container.instance.ts`) by adding the instance to the
   `TokenInsightsService` provider map under its chain(s). A missing slot simply
   yields `unavailable` metrics — no other change needed.

5. **Do NOT** import provider types into UI, add math to a provider, or let a
   vendor name branch UI code. `source` is a label carried in the data only.

## Swapping / fallback

Because routing is a per-chain map, swapping RugCheck→another Solana safety
source is one line in the container. To add a fallback, wrap two providers in a
small composite that tries the primary and falls back on failure — it still
implements the same capability interface.

## Verification checklist for a real vendor

- [ ] Response fixture captured from a live call; mapper test asserts every field
- [ ] Rate-limit (429) path returns `PROVIDER_RATE_LIMIT` (fetch-json handles it)
- [ ] Chain filtering correct (right pair/network)
- [ ] Addresses compared chain-aware (EVM lowercased, Solana base58 preserved)
- [ ] TTL set in `cache.ts` matches how fast the data actually moves
