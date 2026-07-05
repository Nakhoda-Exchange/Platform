# Withdraw — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/wallet/withdraw (تومان tab)
   amount + CardPicker ── requestIrtWithdraw() ─▶ WithdrawUseCase.irt
      │   guards: min ۵۰۰k · ≤ availableIrt (via TradeRepository.getBalances)
      ▼   WalletRepository.requestIrtWithdraw ─▶ irt debited, PENDING tx
/wallet/withdraw?method=crypto
   coin (holdings) + address + amount ── requestCryptoWithdraw()
      │   guards: plausible address · amount > fee · ≤ held
      ▼   requestCryptoWithdraw ─▶ holding debited, PENDING tx (IRT equiv logged)
receipt: «درخواست برداشت ثبت شد» ─▶ تاریخچه (در انتظار)
```

## File map

- Domain: `lib/core/domain/wallet/withdraw.ts` (`MIN_WITHDRAW_IRT`,
  `isPlausibleCryptoAddress`).
- Use case: `withdraw.use-case.ts` (irt/crypto/fees/balances — all guards
  here, reusing `TradeRepository.getBalances` and the market price for the
  IRT equivalent).
- Port additions on `wallet-repository.port.ts`: `getWithdrawFees`,
  `requestIrtWithdraw`, `requestCryptoWithdraw`; mock fee table per coin.
- Actions: `app/actions/withdraw.ts`.
- UI: `components/wallet/irt-withdraw-form.tsx`,
  `crypto-withdraw-form.tsx`, shared `card-picker.tsx` +
  `withdraw-result.tsx`.

## Notes

- Requests never auto-complete in the mock (back-office approval model) —
  by design, matching the pending AC.
- OTP/2FA confirm wires in once auth sessions exist (same blocker as the
  trade KYC gate).
