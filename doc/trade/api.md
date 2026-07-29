# Trade — API contract

Port: `lib/core/application/trade/ports/trade-repository.port.ts` ·
Adapter: `lib/infrastructure/trade/http-trade.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

All money is a **decimal string** on the wire (see conventions). IRT notional is
whole Toman as a string; coin quantities are decimal strings. The **canonical
uppercased `symbol`** is the identifier — never `coinId`/`displaySymbol`.

## Balances — via `GET /portfolio` (no dedicated endpoint)

There is **no** `GET /trade/balances`. The adapter reads the portfolio snapshot
and derives tradable balances from it (`getBalances` → `GET /portfolio`):

- cash = `availableIrt`;
- per-coin units = each holding's `amount`, keyed by **UPPERCASE symbol** (not
  `coin.id`, which differs between the market and ledger contexts).

See [`doc/portfolio/api.md`](../portfolio/api.md) for the full snapshot shape,
including `available`/`locked` and `pendingWithdrawIrt` (#73).

## GET `/trade/limits` — auth

Admin-configurable global order floor plus per-token min/max **IRT notional**
bounds. Each bound is a whole-Toman integer string, or `null` (unbounded).

```jsonc
// 200 — TradeLimitsDto
{
  "defaultMinTradeIrt": "500000", // global floor (string) or null/absent
  "limits": [
    {
      "symbol": "BTC",
      "minBuyIrt": "500000",
      "maxBuyIrt": null,
      "minSellIrt": "500000",
      "maxSellIrt": null,
    },
  ],
}
```

Resolution order for the effective minimum: per-token min → `defaultMinTradeIrt`
→ offline `MIN_ORDER_IRT` (500,000). Keyed by uppercased symbol.

## POST `/trade/quotes` — auth

Price an order **without placing it** — the pre-commit quote the ticket reads the
expected slippage from. Same amount contract as a MARKET submit.

```jsonc
// request
{ "symbol": "BTC", "side": "BUY", "amount": "2000000", "amountUnit": "IRT" }
// 200 — QuoteResponse (only the field the screen reads today)
{ "expectedSlippageBps": 12 }   // number in bps; 0 = firm price; null/absent = unknown
```

`0` is a real answer (firm-price route) and must survive as `0`; `null`/absent =
could not price (venue down / no liquidity) → the UI shows nothing.

## POST `/trade/orders` — auth — submit

The frontend pre-computes fee (`FEE_RATE = 0.35%`) and coin amount for instant
feedback, but the **backend is authoritative** — re-validate min order, balances,
fee and price band. An **`Idempotency-Key`** header rides every submit so a retry
settles once.

```jsonc
// MARKET — `amount` is whole-Toman IRT notional for BOTH sides
{ "symbol": "BTC", "side": "BUY", "orderType": "MARKET",
  "amount": "2000000", "amountUnit": "IRT", "requestedPrice": "4000000000" }

// LIMIT — SPEND-committed: BUY commits IRT, SELL commits the coin amount
{ "symbol": "BTC", "side": "BUY", "orderType": "LIMIT",
  "targetPrice": "3500000000", "amount": "2000000", "amountUnit": "IRT" }
{ "symbol": "BTC", "side": "SELL", "orderType": "LIMIT",
  "targetPrice": "4500000000", "amount": "0.5", "amountUnit": "BTC" }

// optional on either: the user's own slippage tolerance (overrides the coin's)
"slippageBps": 50   // a NUMBER, unlike every sibling money field

// SELL EVERYTHING — sent whenever the entry covers the whole holding
{ "symbol": "BTC", "side": "SELL", "orderType": "MARKET",
  "amount": "2000000", "amountUnit": "IRT", "requestedPrice": "4000000000",
  "sellAll": true }

// commit to a server-minted quote: the fill honours its price for its TTL
"quoteId": "quote_1f2e…"
```

### `sellAll` — the only correct way to sell a whole position

`sellAll: true` makes the backend size the order from the **ledger** and waives
both the minimum-notional floor and the base-amount bounds. Both halves matter,
and neither is reachable from the client:

- the client's figure comes from a page-load price, so drift between then and the
  fill leaves **dust** behind (or over-sells into a rejection);
- without the waiver, a holding whose value has fallen under the minimum order is
  **frozen forever** — too small to sell, and nobody buys more of a coin they are
  trying to exit.

`amount` still travels (the backend ignores it for sizing) and the exact held
units ride along as the coin amount, so a backend without the sell-all path still
empties the position rather than a float re-derivation of it. SELL only; ignored
on a BUY.

`quoteId` and `sellAll` are **mutually exclusive**: a quote may only price the
exact `(symbol, side, amount)` it was minted for, and a sell-all's amount is
decided server-side — pinning one is a guaranteed `QUOTE_MISMATCH`.

Two success shapes plus an in-body rejection:

```jsonc
// 200 — synchronous fill (MARKET today, async settlement flag OFF)
{ "status": "SETTLED", "orderId": "ord_1", "duplicate": false }
// 202 — accepted, now rests/pends (LIMIT always; MARKET once async is ON)
{ "status": "ACCEPTED", "orderId": "ord_1", "phase": "pending" }
// 200 — rejected (reason mapped to Persian client-side)
{ "status": "REJECTED", "reason": "NO_LIQUIDITY" }
```

- On `ACCEPTED` the client polls `GET /trade/orders/{orderId}` (~1s, bounded
  budget) until terminal; a LIMIT gets a short budget then hands off to the
  open-orders list.
- **Reject reasons**: `PRICE_BAND_BREACHED`, `NO_LIQUIDITY`/`NO_ROUTE`,
  `INSUFFICIENT_BALANCE`/`INSUFFICIENT_FUNDS` (see `messageForRejection`).
- **User-fault validation** (the use case, before submit): `EMPTY_AMOUNT`,
  `BELOW_MIN_ORDER`, `UNKNOWN_COIN`, `INSUFFICIENT_IRT`, `INSUFFICIENT_COIN`
  (422). **House faults** (`PRICE_UNAVAILABLE`, `VENUE_UNAVAILABLE`,
  `INSUFFICIENT_LIQUIDITY`, `TRADING_HALTED` — 503 + `retryAfter`) per the
  taxonomy in `doc/api-conventions.md`.
- The receipt (`PlacedOrder`) is built **client-side** from the validated request
  inputs plus the returned `orderId`; the submit result carries settlement
  status, not display fields.
- **Retryable price codes** — `PRICE_UNAVAILABLE`, `PRICE_STALE`,
  `PRICE_OUT_OF_TOLERANCE`, `QUOTE_EXPIRED`, `QUOTE_MISMATCH` all mean «the price
  moved, confirm again», not «your order was refused». The screen reopens the
  confirm sheet with the amounts intact and the same idempotency key.
- **A lost response is not a failure.** While MARKET orders settle synchronously,
  the submit can outlive any client budget — and aborting it does not cancel the
  order. A transport failure on this endpoint becomes `SUBMIT_UNCONFIRMED`, whose
  copy sends the user to check `/orders` and `/wallet` **before** retrying; it
  must never read as «ناموفق», which users act on by placing a second order.

### Error messages are decided client-side, by `code`

The contract says `message` is user-showable Persian — but the trade engine
published its own English domain strings («order size 300000 IRT is below the
minimum 500000 IRT») straight into a toast, so the app no longer takes that on
trust. `lib/core/domain/shared/error-copy.ts` maps the stable `code` to Persian
copy, drops any message that isn't Persian, and collapses internal codes
(`INTERNAL_ERROR`, `BAD_RESPONSE`, `VALIDATION_ERROR`, `CONCURRENT_MODIFICATION`…)
to one generic sentence. **A new user-facing failure needs a `code`** — a message
alone will be shown only if it is genuinely Persian, and never for those codes.

A settled/filled order must appear in `/wallet/transactions` immediately. Fees
are live (0.35%): buyers pay it out of `totalIrt`, sellers receive
`totalIrt − feeIrt`.

## GET `/trade/orders/{orderId}` — auth — status

Single status read; drives the post-`ACCEPTED` poll loop.

```jsonc
{
  "orderId": "ord_1", // `id` also accepted
  "status": "RESERVED", // RESERVED (resting) | SETTLED | REJECTED | CANCELLED
  "reason": null, // machine reason when REJECTED
  "filledAmount": null, // coin units filled (`amountOut` also accepted)
  "totalIrt": null, // IRT notional
}
```

**All-or-nothing (#72):** the order model has **no `partially_filled` state** —
`status` is terminal at `SETTLED`/`REJECTED`/`CANCELLED` and a fill is complete or
not at all. `filledAmount` reflects the settled coin units (equal to the ordered
amount on `SETTLED`, `null`/`0` otherwise); there is no separate
`filledAmountCoin`/`filledTotalIrt` partial-progress pair. If partial venue fills
are ever surfaced, add an explicit `partially_filled` terminal plus those two
fields — until then the contract is explicitly all-or-nothing.

## GET `/trade/orders?status=open` — auth — resting orders

```jsonc
{
  "orders": [
    {
      "orderId": "ord_1",
      "side": "BUY",
      "symbol": "BTC",
      "coinDisplaySymbol": "BTC",
      "orderType": "LIMIT",
      "targetPrice": "3500000000",
      "amount": "2000000",
      "amountCurrency": "IRT",
      "status": "RESERVED",
      "createdAt": "2026-07-21T10:00:00Z",
      "expiresAt": null,
    },
  ],
}
```

`amount` is the committed **spend** in `amountCurrency` (`"IRT"` for a BUY, the
coin symbol for a SELL). `displaySymbol`/`coinDisplaySymbol` are display aliases.

## POST `/trade/orders/{orderId}/cancel` — auth

`200` on success (order `CANCELLED`, reserve released); **`409`** if it already
executed → the client maps it to `ORDER_ALREADY_EXECUTED`, drops the row and
refreshes the list.

## Refund / reserve timing per terminal state (#72/#73)

An accepted order **locks** its spend (`amount` in `amountCurrency`); the lock
resolves at the terminal state:

| Terminal    | Reserve outcome                                                       |
| ----------- | --------------------------------------------------------------------- |
| `SETTLED`   | Reserve consumed; balances net out (coins in / IRT out or vice versa) |
| `REJECTED`  | Reserve released **immediately**, in full                             |
| `CANCELLED` | Reserve released immediately, in full                                 |
| `expired`   | (realtime lifecycle) Reserve released immediately on expiry           |

The released amount must be reflected in the portfolio's `available`/`locked`
split (see #73 below) and any resulting movement mirrored into
`/wallet/transactions`.

## Reconciliation & proof-of-solvency (#75) — **backend follow-up**

These are treasury/Substructure requirements; documented here as the contract the
Platform relies on. None live in Platform code (no treasury tables here):

- **`venueTradeId`** (hedge/leg id): every SETTLED trade MUST persist the upstream
  venue trade/leg id so a user fill maps to its hedge. It is **not** in the
  trade/history/realtime contracts yet — add it to the order-status and
  `trade.update` payloads and to the transaction detail.
- **Solvency invariant**: Σ(user ledger per asset) ≤ Σ(treasury balances: Vault
  wallets + Wallex balance). A periodic check MUST alert on breach. Blocked while
  `te_treasury_balances`/`te_treasury_transactions`/`te_inventory` are empty and
  `EXECUTION_MODE=dry_run`.
- **`withdrawals.approved_at`** MUST be populated on back-office approval (today
  unpopulated) — needed for reconciliation and the statement below.
- **User-facing periodic statements** (per-asset balances + movements, exportable)
  are a launch requirement; `doc/history/PRD.md` currently lists export as a
  non-goal — revisit before public launch.
