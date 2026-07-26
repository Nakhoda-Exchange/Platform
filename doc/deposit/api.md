# Deposit — API contract

Port: `lib/core/application/wallet/ports/wallet-repository.port.ts` (deposit half) ·
Adapter: `lib/infrastructure/wallet/http-wallet.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

> **V0 scope:** crypto deposit is removed — see the **Removed in V0** section
> at the bottom of this file. Only the Toman endpoints are implemented by the
> HTTP adapter for V0.

## Saved cards

Listing/adding/removing/setting-primary a card is the **bank-account**
feature's contract, not deposit's — see
[`doc/bank-account/api.md`](../bank-account/api.md) (`GET/POST /wallet/cards`,
`PUT /wallet/cards/{id}/primary`, `DELETE /wallet/cards/{id}`). Deposit only
consumes the resulting `cardId`.

## POST `/wallet/deposits/card` — auth

Start a card-to-card deposit. **The company's destination card is returned
here, per deposit — never hardcoded client-side.**

```json
// request
{ "cardId": "card_1", "amountIrt": 1000000 }
// 200 — CardDeposit
{
  "id": "dep_1",
  "companyCard": "6219861900045875",
  "companyName": "شرکت ناخدا",
  "expiresInSeconds": 600
}
```

Errors: `NO_CARD`, `EMPTY_AMOUNT`, `BELOW_MIN_DEPOSIT` (min ۱۰۰٬۰۰۰ تومان) — 422.

## GET `/wallet/deposits/{id}/status` — auth

Polled (~3s) while the countdown runs. The client stops polling once the deposit
window elapses (a late `done` must not flip an already-expired screen — #71).

### Shipped contract

What the backend returns today (Substructure `DepositStatusSchema`), and what the
client models as `DepositStatusView` (lib/core/domain/wallet/deposit.ts):

```jsonc
// 200 — DepositStatusView (lib/core/domain/wallet/deposit.ts)
{
  "status": "done", // pending | done | unknown
  // Money crosses as decimal STRINGS, null until `done`. The HTTP adapter
  // parses them to numbers; never consume these raw.
  "creditedIrt": "900000", // what the ledger ACTUALLY credited
  "requestedIrt": "1000000", // what the user typed at start
}
```

| `status`  | Meaning                                      | Money                             |
| --------- | -------------------------------------------- | --------------------------------- |
| `pending` | Waiting for the bank transfer to be observed | Not yet moved; `creditedIrt` null |
| `done`    | Transfer settled and credited                | `creditedIrt` credited            |
| `unknown` | State not determinable (yet)                 | Nothing asserted                  |

### Backend follow-up (#74) — NOT yet emitted

The richer state machine below is a documented requirement, not the current wire
format. Do not branch on these until the backend actually sends them:
`expired` (window closed with no matching transfer), `amount_mismatch` (a
different sum arrived than requested — `observedIrt` held pending resolution),
and `failed` (house/back-office fault, with a `reason`). They would replace
`unknown`.

- **`creditedIrt` is the bank-confirmed settled amount — NOT the user-typed
  amount (#64).** The receipt and the history row MUST render `creditedIrt`; the
  client never asserts the typed amount was credited. A card-to-card transfer is
  a manual bank action, so the arrived sum can differ from what was entered.
- **Late transfer**: a transfer that arrives after `expired` reconciles back to
  `done`/`amount_mismatch` server-side and appears in `/wallet/transactions`; the
  UI, having stopped polling, surfaces it via history rather than the live screen.
- On `done` the balance must already be credited and the transaction flipped in
  `/wallet/transactions`.

## GET `/wallet/deposits/{id}` — auth — deposit detail (#74)

Full detail for a single deposit (history / dispute view), carrying the
**observed** amount alongside the requested one so a mismatch is inspectable.

```jsonc
// 200
{
  "id": "dep_1",
  "status": "amount_mismatch",
  "requestedIrt": 1000000, // what the user entered at start
  "observedIrt": 950000, // what the bank actually received (0 if nothing)
  "creditedIrt": 0, // what was credited (0 until resolved)
  "cardId": "card_1",
  "createdAt": "2026-07-21T10:00:00Z",
  "expiresAt": "2026-07-21T10:10:00Z",
}
```

_Backend follow-up:_ this detail endpoint is a documented requirement; the
Platform HTTP adapter does not call it yet.

## Removed in V0 — GET `/wallet/deposit-address/{coinId}`

Crypto deposit is out of scope for V0. Deferred, not forgotten — the
endpoint below is documented for when the coin deposit flow returns; the
HTTP adapter must not call it in V0.

```json
// auth
// 200
{ "address": "bc1qxy2…", "network": "بیت‌کوین (BTC)" }
```

`network` is the Persian label shown verbatim (with the wrong-network warning).
