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

| `trigger`           | Pays                              | Why |
| ------------------- | --------------------------------- | --- |
| `instant`           | at redemption                     | best conversion; keep the amount small |
| `after_kyc`         | when the user clears KYC          | a real, identified person |
| `after_first_trade` | after their first settled trade   | a real customer |

The deferred two are the anti-abuse control: a throwaway signup is never paid.

## Wallet history

A credited incentive appears in `/wallet/transactions` as a `reward` row (see
[`doc/history/api.md`](../history/api.md)), rendered with the gift icon and the
«پاداش» label.
