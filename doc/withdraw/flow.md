# Withdraw — Implementation flow

Product context: [`PRD.md`](./PRD.md). **V0 scope:** Toman to a saved IBAN
only — crypto withdrawal is removed for V0 (see below).

## Flow

```
/wallet/withdraw (تومان tab)
   amount + IbanPicker (+ matched-card subhead) ── requestIrtWithdraw() ─▶ WithdrawUseCase.irt
      │   guards: min ۵۰۰k · ≤ availableIrt (via TradeRepository.getBalances) · IBAN ownership
      ▼   WalletRepository.requestIrtWithdraw(ibanId, amountIrt) ─▶ irt debited, PENDING tx
receipt: «درخواست برداشت ثبت شد» ─▶ تاریخچه (در انتظار)
```

The withdraw page resolves `ManageIbansUseCase.list()` (the pickable
destinations) **and** `ManageCardsUseCase.list()` (only to look up a
matching card for the subhead — never rendered as a selectable option, never
sent to the action) alongside `WithdrawUseCase.balances()`.

## File map

- Domain: `lib/core/domain/wallet/withdraw.ts` (`MIN_WITHDRAW_IRT`);
  `lib/core/domain/wallet/iranian-banks.ts` (`sameBank`, `detectBankByCard`,
  `detectBankByIban`) — matches a saved card to a شبا by issuing bank for
  the picker's subhead.
- Use case: `withdraw.use-case.ts` (irt — guards here, reusing
  `TradeRepository.getBalances`).
- Port additions on `wallet-repository.port.ts`: `requestIrtWithdraw(ibanId,
amountIrt)`.
- Actions: `app/actions/withdraw.ts` (`requestIrtWithdraw(ibanId, amount)`).
- UI: `components/wallet/irt-withdraw-form.tsx`, `components/wallet/iban-picker.tsx`
  (IBAN radio list + add-via-sheet, mod-97; renders the `sameBank`-matched
  card as a subdued subhead per row), shared `withdraw-result.tsx`.

## Notes

- Requests never auto-complete in the mock (back-office approval model) —
  by design, matching the pending AC.
- OTP/2FA confirm wires in once auth sessions exist (same blocker as the
  trade KYC gate).
- The IBAN itself is added/removed/set-primary through the shared
  `حساب‌های بانکی` instrument list (`doc/bank-account/`) — `IbanPicker` only
  _selects_ among the already-saved IBANs; adding a brand-new شبا from the
  withdraw sheet still goes through `ManageIbansUseCase.add` (format check →
  ownership inquiry → persist), same as the account hub.

## Removed in V0 — crypto withdrawal

```
/wallet/withdraw?method=crypto
   coin (holdings) + address + amount ── requestCryptoWithdraw()
      │   guards: plausible address · amount > fee · ≤ held
      ▼   requestCryptoWithdraw ─▶ holding debited, PENDING tx (IRT equiv logged)
```

Was: `lib/core/domain/wallet/withdraw.ts` `isPlausibleCryptoAddress`;
`withdraw.use-case.ts` crypto/fees branch; `getWithdrawFees` /
`requestCryptoWithdraw` on `wallet-repository.port.ts` (mock fee table per
coin); `crypto-withdraw-form.tsx`. Removed by the UI/infra agents in
parallel with this doc update; comes back post-V0.
