# Bank accounts (حساب‌های بانکی) — Product Requirements (PRD)

## Summary

Under the account hub, a user manages the payout instruments used for Toman
deposit/withdraw: **bank cards** (کارت‌های بانکی, card-to-card deposit) and
**IBANs/شبا** (withdrawal destinations). Both live on one screen, two tabs,
same recipe: a list of saved instruments, add, remove, set-primary. Every
instrument added is checked against the banking network to confirm it's
registered to the **signed-in, KYC-verified user** — you can never save
someone else's card or شبا.

## Goals

- One place («حساب‌های بانکی») for both instrument types, reached from the
  account hub.
- Adding an instrument is minimal: type the number, we resolve the owner
  name from the bank — the user never types a name.
- **Ownership is enforced server-side** on every add: the instrument's
  registered holder must match the KYC'd identity, or it's rejected.
- Exactly one **primary** instrument per type when any exist — it's the one
  auto-selected on the deposit/withdraw screens.
- Requires KYC: only a verified user can add a card or IBAN.

## Non-goals (this tier)

- **Editing** a saved number — remove and re-add instead (numbers are
  never mutable once saved).
- Nicknaming/labeling instruments, reordering beyond primary/non-primary,
  multiple currencies, foreign banks.

## Entry point

Account hub (`/account`) → row **«حساب‌های بانکی»** → `/account/bank-accounts`.

## Screen — two tabs

| Tab   | Label (fa)     | Instrument | Format                            |
| ----- | -------------- | ---------- | --------------------------------- |
| Cards | کارت‌های بانکی | Bank card  | 16 digits, Luhn checksum          |
| IBANs | شماره‌های شبا  | IBAN (شبا) | `IR` + 24 digits, mod-97 checksum |

Each tab is an independent list — its own add flow, its own primary.

### List row

Per saved instrument: masked/formatted number, registered owner name,
verification **status** chip, a **primary** indicator (or a "تنظیم به‌عنوان
پیش‌فرض" action when it isn't), and a remove action.

| Status (fa)  | Meaning                                              |
| ------------ | ---------------------------------------------------- |
| تأیید شده    | Ownership confirmed by the bank inquiry (`verified`) |
| در حال بررسی | Saved, inquiry result pending (`pending`)            |

- Only one instrument per tab is primary at a time. The first instrument a
  user adds becomes primary automatically; removing the primary promotes
  the next remaining one (if any) — a non-empty list always has exactly one
  primary.
- The primary card/IBAN is what deposit ("واریز") / withdraw ("برداشت")
  pre-select.

### Add instrument

A bottom sheet (reuse the deposit/withdraw card-picker's add pattern):
one field — card number or شبا — Persian-digit input normalized to Latin,
`dir="ltr"`. The user **never types an owner name**; it comes back from the
bank inquiry.

1. Client-side format check (16 digits + Luhn for cards; `IR` + 24 digits +
   mod-97 for IBAN) — inline error, no network call on a malformed number.
2. Submit → the backend re-validates the format **and** runs the ownership
   inquiry against the banking network (Shaparak for cards, Sheba for
   IBANs).
3. **Owner matches the KYC'd user** → saved, shown with its owner name and
   status.
4. **Owner doesn't match** → rejected, nothing saved; inline error: «این
   {کارت|شبا} به نام شما نیست. فقط حساب‌های به نام خودتان را می‌توانید
   اضافه کنید.»

### Remove

Confirm, then delete. If the removed instrument was primary and others
remain, the next one is promoted automatically (no separate step for the
user).

## KYC gate

Bank account management **requires KYC** (`profile.kycVerified`). An
unverified user sees the same «تکمیل احراز هویت» CTA pattern as the account
hub instead of the add/manage UI — they're routed to `/kyc` to finish
identity verification first.

## States & edge cases

- **Empty tab** — no cards/IBANs yet: empty state + "افزودن" CTA, no primary
  concept until the first one exists.
- **Duplicate number** — adding a number already saved returns the existing
  record rather than creating a second one.
- **Invalid format** — inline error, no network call (`INVALID_CARD` /
  `INVALID_IBAN`).
- **Not the user's own instrument** — `NOT_OWNER`, nothing saved (see
  Add instrument, step 4).
- **Remove the only instrument** — list goes empty; no primary until a new
  one is added.
- **Network/backend failure** — generic retry message; no partial state
  (an instrument is either fully saved or not saved at all).

## Copy (Persian)

- Screen title: «حساب‌های بانکی»
- Tabs: «کارت‌های بانکی» / «شماره‌های شبا»
- Add CTA: «افزودن کارت» / «افزودن شبا»
- Status chips: «تأیید شده» / «در حال بررسی»
- Primary badge: «پیش‌فرض» — action to set: «تنظیم به‌عنوان پیش‌فرض»
- Ownership error: «این کارت به نام شما نیست. فقط حساب‌های به نام خودتان را
  می‌توانید اضافه کنید.» (شبا wording swaps «کارت» → «شبا»)
- Format errors: «شماره کارت درست نیست. ۱۶ رقم کارت را بررسی کنید.» /
  «شماره شبا درست نیست. «IR» به‌همراه ۲۴ رقم را بررسی کنید.»

## Success metric

Add success rate (format-valid submissions that pass ownership); NOT_OWNER
rate (should track attempted fraud/typos, not legitimate users); primary
instrument coverage (share of active users with a primary card/IBAN set).

## Design & implementation

- Visual system: `DESIGN.md` + `COMPONENTS.md`.
- Developer flow, architecture, API contract: [`flow.md`](./flow.md),
  [`api.md`](./api.md).
