# API conventions (backend ⇄ frontend)

Shared rules for every endpoint. Per-feature contracts live in
`doc/<feature>/api.md`; each maps 1:1 to a frontend **port**
(`lib/core/application/<feature>/ports/*.port.ts`) and its HTTP adapter
(`lib/infrastructure/<feature>/http-*.repository.ts`).

## Transport

- Base URL comes from the frontend's `API_BASE_URL` env (e.g.
  `https://api.nakhoda.example/v1`). All paths below are relative to it.
- JSON in, JSON out. `Content-Type: application/json` on bodies.
- The frontend calls server-side only (server components / actions) through
  one shared client (`lib/infrastructure/http/http-client.ts`) with a 15s
  timeout and `cache: no-store`.

## Auth

- The frontend forwards the login session as `Authorization: Bearer <token>`
  on every request (interceptor). Endpoints marked **auth** must reject a
  missing/invalid token with **401**.
- `Accept-Language: fa-IR` is always sent; messages must be Persian.

## Errors — the contract the UI renders

Every non-2xx response body:

```json
{ "code": "INSUFFICIENT_IRT", "message": "موجودی تومانی شما کافی نیست." }
```

- `code`: stable SCREAMING_SNAKE identifier (the UI may branch on it — e.g.
  the reset flow jumps to the step named by the code).
- `message`: **user-showable plain Persian** — verbs first, states the fix,
  no jargon. The UI renders it verbatim; a missing message falls back to a
  generic Persian string per status.
- Status classes: validation/business **422**, auth **401/403**, unknown
  resource **404**, conflict/idempotency race **409**, house-fault/unavailable
  **503** (see below), no-payload success **204**.

### House-fault & liquidity taxonomy (#74)

User-fault codes (422) are documented per feature. Beyond those, the trade/price
pipeline emits **house-fault** codes the client already handles — these are NOT
the user's fault and must never read as "insufficient balance":

| HTTP | `code`                   | Meaning                                 | Client behavior                        |
| ---- | ------------------------ | --------------------------------------- | -------------------------------------- |
| 503  | `PRICE_UNAVAILABLE`      | No fresh price (source/bridge down)     | Refuse the trade; «قیمت در دسترس نیست» |
| 503  | `VENUE_UNAVAILABLE`      | Upstream venue (Wallex/CEX) unreachable | Retry later; honor `retryAfter`        |
| 503  | `INSUFFICIENT_LIQUIDITY` | No route can fill this size             | «امکان انجام این معامله نیست»          |
| 503  | `TRADING_HALTED`         | Trading paused (globally or per market) | Disable the ticket                     |

- **`retryAfter`**: 503 bodies MAY carry `"retryAfter": <seconds>` (mirror it in
  the `Retry-After` header) so the client can back off.
- **Order-reject reasons** (returned inside a `200/202` submit result, not an
  HTTP error) are `PRICE_BAND_BREACHED`, `NO_LIQUIDITY`/`NO_ROUTE`,
  `INSUFFICIENT_BALANCE`/`INSUFFICIENT_FUNDS` — mapped to Persian in
  `http-trade.repository.ts` (`messageForRejection`).
- **Per-market halt**: each coin SHOULD carry a `tradingEnabled` flag (default
  `true`) so the UI can pre-disable the ticket; a hard `TRADING_HALTED` 503 is
  the authoritative backstop. _(Backend + Platform follow-up — the `Coin` type
  does not carry the flag yet.)_

## Data conventions

- **Money is a decimal STRING on the wire**, not a number. Coin prices, ledger
  cash, holdings, portfolio history and transaction amounts all serialize as
  exact `numeric(38,18)` decimal strings and are parsed with `parsePrice`
  (`lib/core/domain/market/price.ts`) only to format or compute. Rationale:
  memecoin prices are **sub-Toman** (the money formatter carries up to
  `SMART_DECIMALS_CAP = 12` fractional digits, `lib/utils/money.ts`), so the old
  "integers in Toman, no decimals" rule is wrong for prices and would drop
  precision past 2^53. IRT is still **whole Toman** (no Rial) as a _unit_, but it
  travels as a string.
  - **Nullable prices**: `priceIrt`/`priceUsd` on a `Coin` and `high24h`/`low24h`
    on a detail are `string | null`. `null` = **UNAVAILABLE** — render «—» /
    «قیمت در دسترس نیست», NEVER `0` and NEVER a stale figure.
  - **Order-submit amounts** are whole-Toman integer **strings** for IRT notional
    (`amount`, `requestedPrice`, `targetPrice`) and decimal strings for coin
    quantities (`amountUnit: "<SYMBOL>"`).
  - **Live WebSocket ticks are numeric** (not strings) — see `doc/realtime/api.md`.
- **Dates/times**: ISO 8601 UTC strings (`"2026-07-06T09:30:00Z"`) unless a field
  is documented as **epoch ms** (chart points, WS `at`) or a **Jalali string**
  `YYYY/MM/DD` with Latin digits (birth dates).
- **Digits**: payloads use Latin digits; the frontend renders Persian.
- **Ids**: opaque strings. Coin ids are lowercase (`"btc"`); the **canonical
  `symbol`** (uppercased) is the identifier for orders, balance keys and routes —
  `displaySymbol`/`nameFa` are display-only aliases.
- **Idempotency**: order submits send an `Idempotency-Key` header; a retried
  submit settles once and MAY echo `"duplicate": true` (see `doc/trade/api.md`).
- `DELETE`/acknowledge-style success with no payload: **204**.

## Statuses

- **Login status**: `registration | approved | declined`.
- **Transaction status** (`/wallet/transactions`): today `pending | done | failed`
  (`lib/core/domain/wallet/transaction.ts`). Contract gap (#72/#74): a terminal
  **`expired`** order and a deposit **`amount_mismatch`/`expired`** have no
  transaction status to land in — a terminal `expired` MUST be mappable into
  history. Adding `expired` (and surfacing deposit mismatch/expiry) is a required
  follow-up; see the per-feature docs.
- **Order status** (`/trade/orders`): `RESERVED | SETTLED | REJECTED | CANCELLED`
  (`lib/core/domain/trade/order.ts`; `RESERVED` is the only non-terminal state).
- **Deposit status** (`/wallet/deposits/{id}`): `pending | done | expired |
amount_mismatch | failed` (`lib/core/domain/wallet/deposit.ts`).
- **Realtime trade status**: `pending | open | done | expired | failed`
  (`doc/realtime/api.md`).
