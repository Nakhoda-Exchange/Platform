# Trade — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/trade/[symbol]?side= ── GetTradeContextUseCase ─▶ market.listCoins + trade.getBalances
   │        (coin, availableIrt, availableCoin)
   ▼
TradeScreen (client): side toggle → keypad amount → confirm step
   │  placeTradeOrder() ──▶ PlaceOrderUseCase (ALL guards; amountCoin = IRT/price)
   │                            └─▶ TradeRepository.placeOrder ─▶ settleTrade()
   ▼                                     (mock-wallet-state: holdings± , irt±, tx log)
receipt ── links ─▶ /wallet · /market
```

## File map

- Domain: `lib/core/domain/trade/order.ts` (`MIN_ORDER_IRT`, `TradeSide`,
  `TradeContext`, `PlacedOrder`).
- Port: `lib/core/application/trade/ports/trade-repository.port.ts`
  (`getBalances`, `placeOrder`); mock settles via
  `lib/infrastructure/portfolio/mock-wallet-state.ts` (`settleTrade`).
- Use cases: `get-trade-context.use-case.ts`,
  `place-order.use-case.ts` (+ unit tests for every guard).
- Action: `app/actions/trade.ts` (+ `trade-state.ts`).
- UI: `components/trade/trade-screen.tsx`, `components/trade/keypad.tsx`.
- Header: `/trade/[symbol]` shows back → that coin's PDP
  (`components/layout/platform-header.tsx` pattern match).

## Notes

- The «فروش همه» clamp: MAX enters `floor(held × price)` Toman, so the
  derived coin amount may exceed holdings by a rounding hair — clamped to a
  full sell in the use case, unit-tested.
- Fees intentionally absent here; they land with `doc/referral` phase 1 and
  add a «کارمزد» line to the confirm + receipt.
