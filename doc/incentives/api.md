# Incentives — API contract

Port: `lib/core/application/incentives/ports/incentives-repository.port.ts` ·
Adapter: `lib/infrastructure/incentives/http-incentives.repository.ts` ·
Conventions: [`doc/api-conventions.md`](../api-conventions.md)

Growth incentive codes: admin-issued promo/invite codes that pay a reward in IRT
or any listed coin. Replaces the removed invite-a-friend program — those codes
were user→user and IRT-only; these are admin-issued, decoupled from any inviter,
and pay any listed asset.

## GET `/incentives/signup-config`

**Public** (no auth) — the KYC/login screens have no session yet and must know
whether an invite code is mandatory.

```json
// 200
{ "inviteOnly": false }
```

When `true`, registration is closed to anyone without a valid code; the KYC form
makes the field required. Existing users are unaffected — this gates signup, not
login.

## GET `/incentives/validate?code=NOWRUZ`

**Public** — resolves what a code pays WITHOUT redeeming it, so a screen can show
the reward before the user commits.

```json
// 200
{
  "code": "NOWRUZ",
  "asset": "irt",
  "symbol": "IRT",
  "assetName": "تومان",
  "amount": "50000",
  "trigger": "instant"
}
```

Errors: `INCENTIVE_CODE_NOT_FOUND` (404), `INCENTIVE_CODE_INACTIVE` /
`INCENTIVE_CODE_EXPIRED` / `INCENTIVE_CODE_NOT_STARTED` /
`INCENTIVE_CODE_EXHAUSTED` (422).

## POST `/incentives/redeem` — **auth**

Redeems a code for the signed-in user (the account-area «کد هدیه» screen).

```json
// request
{ "code": "NOWRUZ" }
// 200
{
  "redemptionId": "rdm_9f2…",
  "asset": "shib",
  "symbol": "SHIB",
  "amount": "1000000",
  "trigger": "after_kyc",
  "credited": false
}
```

`credited: true` ⇒ the reward is already in the wallet. `false` ⇒ it lands when
the user reaches `trigger` (`after_kyc` or `after_first_trade`).

Errors: the validate errors above, plus `INCENTIVE_ALREADY_REDEEMED` (409 — one
redemption per user per code) and `INCENTIVE_ASSET_UNAVAILABLE` (422 — the coin
was delisted after the code was minted).

## `inviteCode` on the KYC inquiry

`POST /kyc/identity-inquiry` accepts an optional `inviteCode` (see
[`doc/kyc/api.md`](../kyc/api.md)) — how a code typed during signup is redeemed.
It is sent only when non-empty.

Backend behaviour, and the reason the frontend does not surface an error for it:
redemption there is **best-effort**. The account already exists by that point, so
an expired or exhausted code costs the user the reward, never their signup. The
one exception is invite-only mode, where a missing/unusable code fails the
signup outright with `INVITE_CODE_REQUIRED` (403).

## Payout timing

Set per code by an admin, because the right timing is a campaign decision:

| `trigger`           | Pays                            | Why                                    |
| ------------------- | ------------------------------- | -------------------------------------- |
| `instant`           | at redemption                   | best conversion; keep the amount small |
| `after_kyc`         | when the user clears KYC        | a real, identified person              |
| `after_first_trade` | after their first settled trade | a real customer                        |

The deferred two are the anti-abuse control: a throwaway signup is never paid.

## Withdrawal locks

`payoutTrigger` answers "when do we pay?". A **lock** answers the separate
question "once paid, when may it leave?" — a campaign can gift 100,000 IRT that
the user trades with immediately but cannot cash out for 30 days.

Two things about a lock that are easy to get wrong:

- **The money is fully tradeable.** A lock gates the exit, not the use. That is
  not a nicety: the volume condition asks the user to trade the gift, so a lock
  that froze it could never be satisfied. Word it «قابل برداشت نیست», never
  «مسدود».
- **Release is a cliff.** Every configured condition must be met _together_, and
  until then **nothing** frees up. Showing a progress bar at 95% without saying
  so would be a lie of omission.

### GET `/incentives/locks` — **auth**

```jsonc
{
  "lockedIrt": "100000", // subtract from the available balance
  "items": [
    {
      "id": "lck_9f2…",
      "amountIrt": "100000",
      "unlockAt": "2026-08-26T12:00:00Z", // null = no time condition
      "requiredVolumeIrt": "2000000", // null = no volume condition
      "requiredDepositIrt": null, // null = no deposit condition
      "forfeitAt": "2026-10-25T12:00:00Z", // null = never expires
      "volumeIrt": "750000", // progress since the gift landed
      "depositIrt": "0",
      "unmet": ["time", "volume"], // never empty — a met lock is released
      "canForfeit": true,
    },
  ],
}
```

Reading this also **releases** any lock whose terms have come good, so the answer
is never stale: a user who just earned their gift sees it freed the moment they
look.

### POST `/incentives/locks/{id}/forfeit` — **auth**

Gives up an unvested gift: we recover what remains and the floor drops to zero
permanently. Available only when `canForfeit` is true (the campaign chose
`forfeit` over `block`).

```jsonc
{ "outcome": "forfeited", "recoveredIrt": "100000" }
```

Be precise with the user about what this buys them: it does **not** free up more
money at that instant — recovering X lowers the balance and the floor by the same
X. What it ends is the encumbrance, so future deposits are freely withdrawable.
That is exactly what someone stuck behind terms they can no longer meet needs,
and it is the whole reason the option exists.

`outcome: "released"` means the terms turned out to be already met and nothing
was taken — a user is never charged for money they had earned.

### Where it surfaces

The withdraw screen nets `lockedIrt` out of the available balance before the user
types an amount. Without that they meet a «موجودی کافی نیست» on a balance they
can plainly see, which reads as a bug. The backend enforces the same floor inside
the reserve statement regardless, so the UI figure is a courtesy, not the control.

## Wallet history

A credited incentive appears in `/wallet/transactions` as a `reward` row (see
[`doc/history/api.md`](../history/api.md)), rendered with the gift icon and the
«پاداش» label.

A recovered gift appears as a `clawback` row — «بازپس‌گیری هدیه», rendered as a
DEBIT. It is deliberately its own type rather than a negative `reward`: it is the
only history row that takes back money the user was previously shown as theirs,
and it should say so plainly.
