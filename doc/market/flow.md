# Market — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/market ── GetMarketOverviewUseCase ─▶ MarketRepository.listCoins()
   │            (topGainers / trending / newCoins / all derived in use case)
   │  search (client, ?q=) ▶ filtered list · filters (?f=) ▶ sorted list
   ▼
/market/[symbol] ── GetCoinDetailUseCase ─▶ MarketRepository.getCoinDetail()
   │            (coin + high/low/volume/description + series per range)
   ├─ range tabs: client-side swap of preloaded series (no round-trip)
   └─ خرید/فروش ─▶ /trade/[symbol]?side=buy|sell
```

## File map

- Port: `lib/core/application/market/ports/market-repository.port.ts`
  (`listCoins`, `getCoinDetail`); mock in `lib/infrastructure/market/`.
- Use cases: `get-market-overview.use-case.ts`, `get-coin-detail.use-case.ts`.
- UI: `components/market/*` — `MarketScreen` (search + URL sync via
  `lib/utils/url-param.ts` → `history.replaceState`), `AllAssets` (filter
  chips), `CoinRow`, `CoinIcon` (logo w/ letter-badge fallback),
  `PriceChart` (client range tabs), `CoinStats`, `CoinDetailScreen`.
- Formatting: `lib/utils/money.ts` (IRT/USD/percent/market-cap/coin-amount).

## Notes

- Filtering/sorting is client-side over the mock list by design; move it
  into `listCoins(query?, sort?)` on the HTTP adapter when the backend
  lands (the port is the seam).
- Unknown symbol → `notFound()`.
