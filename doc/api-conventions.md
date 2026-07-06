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
- Validation errors: **422**. Auth: **401/403**. Unknown resource: **404**.

## Data conventions

- **Money**: integers in **Toman** (`amountIrt`, `priceIrt`…). No decimals,
  no Rial. USD prices are decimal numbers.
- **Dates/times**: ISO 8601 UTC strings in payloads (`"2026-07-06T09:30:00Z"`)
  unless a field is documented as **epoch ms** (chart points) or a **Jalali
  string** `YYYY/MM/DD` with Latin digits (birth dates).
- **Digits**: payloads use Latin digits; the frontend renders Persian.
- **Ids**: opaque strings. Coin ids are lowercase (`"btc"`).
- `DELETE`/acknowledge-style success with no payload: **204**.

## Statuses

Login status: `registration | approved | declined`.
Transaction status: `pending | done | failed`.
