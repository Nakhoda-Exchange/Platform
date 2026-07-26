# Trade — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/trade/[symbol]?side= ── GetTradeContextUseCase ─▶ market.listCoins + trade.getBalances (via /portfolio)
   │        (coin, availableIrt, availableCoin, limits, defaultMinIrt)
   ▼
TradeScreen (client): side toggle → keypad amount → (quote) → confirm step
   │  placeTradeOrder() ──▶ PlaceOrderUseCase (ALL guards; amountCoin = IRT/price; 0.35% fee)
   │                            └─▶ TradeRepository.placeOrder ─▶ POST /trade/orders (Idempotency-Key)
   │                                   ├─ 200 SETTLED ─▶ receipt (built from validated inputs + orderId)
   │                                   └─ 202 ACCEPTED ─▶ poll GET /trade/orders/{id} → terminal / open-orders
   ▼
receipt ── links ─▶ /wallet · /market
```

## File map

- Domain: `lib/core/domain/trade/order.ts` (`MIN_ORDER_IRT`, `FEE_RATE`,
  `TradeSide`, `OrderType`, `OrderStatus`, `TradeContext`, `PlacedOrder`,
  `OrderSubmission`, `OpenOrder`); `quote.ts` (`TradeQuote`).
- Port: `lib/core/application/trade/ports/trade-repository.port.ts`
  (`getBalances`, `getLimits`, `getQuote`, `placeOrder`, `getOrder`,
  `listOpenOrders`, `cancelOrder`).
- Adapter: `lib/infrastructure/trade/http-trade.repository.ts` (HTTP; balances
  are derived from `GET /portfolio` — the old mock wallet store and
  `settleTrade()` no longer exist).
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
- **Fee is live**: the 0.35% market-order fee (`FEE_RATE`) is fully implemented —
  a «کارمزد» line on the confirm + receipt, feeding the referral pool
  (`doc/referral`). It is NOT "intentionally absent".
- **Async lifecycle**: a MARKET order settles synchronously today (`SETTLED`); a
  LIMIT order (and MARKET once async settlement is enabled) returns `ACCEPTED`
  and rests — the client polls `GET /trade/orders/{id}` to a terminal state, then
  hands off to the open-orders list. See `doc/trade/api.md`.
