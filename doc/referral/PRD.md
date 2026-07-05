# «کد دعوت ناخدا» — Referral Program PRD

## Summary

A **profit-first** referral program. Rewards are paid **only** as a share of
trading fees actually collected from referred users — there are no signup
bounties. That gives us zero upfront CAC, nothing for fake-account farms to
harvest, and — by construction — the house keeps **≥50% of every referred
fee**. Every Toman paid out is a slice of marginal revenue that would not
exist without the referral.

## Prerequisite — trading fees

The app currently charges **no trading fee**. This program requires
introducing a **0.35% market-order fee** (competitive with Nobitex/Wallex).
The fee is the revenue engine the program shares; without it there is nothing
to pay rewards from. Fee work ships first (see [`flow.md`](./flow.md), build
order step 1).

## Goals

- Acquire traders, not signups: reward only behavior that produces fee
  revenue.
- Keep the house profitable on **every** referred trade — payout is capped at
  50% of the fee by construction.
- Give both sides a real reason to act: the invitee saves on fees, the
  referrer earns from every trade their friends make.
- Fully RTL Persian, mobile-first, same look as the rest of the platform.

## Non-goals (this tier)

- **Multi-level referrals** — no rewards on invitees-of-invitees (pyramid
  shape; regulatory and abuse risk). One level only.
- **Cash bounties per signup** — no reward for an account that never trades.
- **Off-platform payout** — rewards land in the wallet balance only; no bank
  transfer of reward money as such.
- **Custom vanity codes** — codes are system-generated. Do not build
  speculatively.

## User story

> As a user, I send my invite code to a friend; they sign up with it, pass
> KYC, and trade — and I see my share of their fees land in my wallet, so I
> keep inviting.

## Mechanics (two-sided)

| Side         | Reward                                                             | Window                |
| ------------ | ------------------------------------------------------------------ | --------------------- |
| **Invitee**  | 30% fee discount (0.35% → ~0.245%)                                 | first 90 days         |
| **Referrer** | 30–50% of every fee their invitees generate, credited in **Toman** | 12 months per invitee |

- The invitee discount is the reason to enter a friend's code at signup —
  it's a concrete saving on day one, not a coupon for something they might
  never do.
- Referrer share is credited to the **wallet balance** (spendable on the
  platform) and appears in the transaction history as «پاداش دعوت».

### Referrer tiers

| Tier | Requirement         | Fee share |
| ---- | ------------------- | --------- |
| Base | —                   | 30%       |
| 2    | ≥10 active invitees | 40%       |
| 3    | ≥50 active invitees | 50%       |

- **Hard cap 50%** — the ceiling exists so every referred trade stays
  profitable for the house, at every tier.
- **Active invitee** = KYC-passed **and** at least one trade in the last 30
  days. Dormant accounts don't count toward tiers.

## Unit economics — the house always wins

All figures are % of trade volume, at the launch fee of 0.35% and base 30%
referrer share:

| Phase                         | Invitee pays | Referrer earns          | House keeps |
| ----------------------------- | ------------ | ----------------------- | ----------- |
| Discount window (first 90d)   | 0.245%       | 0.0735% (30% of 0.245%) | **0.1715%** |
| After 90 days                 | 0.35%        | 0.105% (30% of 0.35%)   | **0.245%**  |
| After 90 days, top tier (50%) | 0.35%        | 0.175%                  | **0.175%**  |

Worst case (discount window at top tier) the house still keeps half the paid
fee. And every row is **marginal revenue** — fee income from a user we would
not have without the referral. There is no scenario where a referred trade
loses money.

## Anti-abuse

- **KYC on both sides** before any reward accrues — no anonymous farms.
- **Self-referral blocked** — national-code and bank-card matching between
  referrer and invitee (the KYC + card data we already collect makes this
  cheap).
- **Rewards accrue only from trade fees** — never from deposits, so cycling
  money in and out earns nothing.
- **Payout floor ۵۰٬۰۰۰ تومان** — accrued rewards below the floor stay
  pending; kills micro-farming economics.
- **Wash-trading detection with clawback** — self-matching / circular volume
  between linked accounts voids the associated rewards and can claw back
  already-credited amounts. Rewards are a share of _honest_ fee revenue.

## KPIs

- Invite → signup conversion.
- Signup → first-trade conversion (the metric that separates traders from
  tourists).
- K-factor.
- Referred fee revenue / month.
- **Payout ratio** — total rewards paid ÷ referred fee revenue; target
  **≤35%** (structurally capped at 50%).

## Copy (Persian)

| Key                  | String (fa)            |
| -------------------- | ---------------------- |
| Account-menu row     | «دعوت از دوستان»       |
| Page title           | «کد دعوت»              |
| Share CTA            | «ارسال کد دعوت»        |
| Copy code            | «کپی کد»               |
| Earnings             | «درآمد شما از دعوت‌ها» |
| Active friends       | «دوستان فعال»          |
| Reward history label | «پاداش دعوت»           |

How-it-works steps — plain, warm, verbs-first, no jargon:

1. «کدت را برای دوستت بفرست»
2. «دوستت با کد تو ثبت‌نام و احراز هویت می‌کند»
3. «از هر معامله او سهم می‌گیری»

## Numbers are tunable

The 0.35% fee, the 30%/90-day invitee discount, the 30→40→50% tiers, and the
12-month referrer window are **launch proposals** — tune them freely in
review. The **invariant** is the shape: rewards are a share of collected fees
only, and total payout is capped at **≤50% of referred fees**. Any tuning
that preserves that invariant preserves the profitability guarantee.

## Success metric

Referred fee revenue per month growing while the payout ratio stays ≤35%;
signup→first-trade conversion of referred users beating organic.

## Design & implementation

- Visual system: `DESIGN.md` + `COMPONENTS.md` (blue-only palette; one logo).
- Developer flow, architecture, build order: [`flow.md`](./flow.md).
