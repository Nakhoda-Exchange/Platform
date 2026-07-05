# Deposit — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/wallet/deposit (تومان tab)
   amount + CardPicker (sheet add → addBankCard, Luhn in domain bank-card.ts)
      │ startCardDeposit(cardId, amount)
      ▼
   DepositIrtUseCase.start ─▶ WalletRepository.initiateCardDeposit
      │        └─ pending tx logged; mock schedules the "backend event" (~15s)
      ▼
   transfer screen: fetched companyCard + countdown + poll checkDeposit(id)
      │        status=done ─▶ receipt (balance credited)
      ▼
/wallet/deposit?method=crypto
   coin chips ─▶ GetDepositAddressUseCase ─▶ address+network ─▶ QR (server SVG)
```

## File map

- Domain: `lib/core/domain/wallet/deposit.ts` (`MIN_DEPOSIT_IRT`,
  `CardDeposit`), `bank-card.ts` (normalize + **Luhn**, unit-tested).
- Port: `wallet-repository.port.ts` (`getDepositAddress`, `listCards`,
  `addCard`, `initiateCardDeposit`, `getDepositStatus`); mock in
  `lib/infrastructure/wallet/mock-wallet.repository.ts`.
- Use cases: `deposit-irt.use-case.ts` (start/status),
  `manage-cards.use-case.ts`, `get-deposit-address.use-case.ts`.
- Actions: `app/actions/deposit.ts` (imperative, called via
  `useTransition`).
- UI: `components/wallet/irt-deposit-form.tsx` (3 steps),
  `card-picker.tsx` (shared with withdraw), `crypto-deposit-view.tsx`
  (QR via the `qrcode` dep, rendered server-side), `components/ui/sheet.tsx`.

## Notes

- The QR container stays `bg-white` in dark mode (scan contrast).
- A real adapter replaces the mock's `setTimeout` event with a webhook/
  server event; the polling contract (`getDepositStatus`) is the seam.
