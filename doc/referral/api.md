# Referral — API contract

Port: `lib/core/application/referral/ports/referral-repository.port.ts` ·
Adapter: `lib/infrastructure/referral/http-referral.repository.ts` ·
Economics: [`PRD.md`](./PRD.md) · Conventions: [`doc/api-conventions.md`](../api-conventions.md)

## GET `/referral/facts` — auth

Raw facts only — tier percentages are domain logic the frontend computes
(30% → 40% @10 active → 50% @50, capped).

```json
// 200 — ReferralFacts
{
  "code": "K7QX2M",
  "invitedCount": 3,
  "activeCount": 2, // KYC-passed + traded in the last 30 days
  "earnedIrt": 680000, // lifetime rewards
  "invitees": [
    // the people who signed up with this code, newest first
    { "name": "مهدی کریمی", "joinedAt": "2025-07-01", "active": false },
    { "name": "سارا احمدی", "joinedAt": "2025-06-18", "active": true }
  ]
}
```

`invitees[].name` is a display name masked by the backend (privacy);
`active` mirrors the same rule as `activeCount`.

## POST `/referral/apply` — auth

Attribute the (newly KYC-passed) caller to an inviter's code. The frontend
calls this once, at KYC confirm, with the code captured from `/login?ref=`.

```json
// request
{ "code": "M4RZ9A" }
// 204
```

Errors: `INVALID_CODE` (422), `SELF_REFERRAL` (422 — national-code/bank-card
match, per the PRD's anti-abuse rules), `ALREADY_ATTRIBUTED` (409).

## Notes for backend

- Reward payouts are backend-driven: credit the inviter's Toman balance and
  append a `reward` transaction («پاداش دعوت») per doc/history/api.md — the
  frontend renders them; it never computes payouts.
- Enforce the PRD invariants server-side: rewards only from trade fees,
  payout floor ۵۰٬۰۰۰ تومان, wash-trading clawback.
