# Deposit — Implementation flow

Product context: [`PRD.md`](./PRD.md). **V0 scope:** Toman card-to-card only
— crypto deposit is removed for V0 (see below).

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
```

## File map

- Domain: `lib/core/domain/wallet/deposit.ts` (`MIN_DEPOSIT_IRT`,
  `CardDeposit`), `bank-card.ts` (normalize + **Luhn**, unit-tested).
- Port: `wallet-repository.port.ts` (`listCards`, `addCard`,
  `initiateCardDeposit`, `getDepositStatus`); mock in
  `lib/infrastructure/wallet/mock-wallet.repository.ts`.
- Use cases: `deposit-irt.use-case.ts` (start/status),
  `manage-cards.use-case.ts`.
- Actions: `app/actions/deposit.ts` (imperative, called via
  `useTransition`).
- UI: `components/wallet/irt-deposit-form.tsx` (3 steps), `card-picker.tsx`,
  `components/ui/sheet.tsx`. (Withdraw's destination picker is
  `iban-picker.tsx` — Toman withdrawal settles to a شبا, not a card; see
  [`doc/withdraw/flow.md`](../withdraw/flow.md).)

## Notes

- A real adapter replaces the mock's `setTimeout` event with a webhook/
  server event; the polling contract (`getDepositStatus`) is the seam.

## Removed in V0 — crypto deposit

```
/wallet/deposit?method=crypto
   coin chips ─▶ GetDepositAddressUseCase ─▶ address+network ─▶ QR (server SVG)
```

Was: `getDepositAddress` on `wallet-repository.port.ts`,
`get-deposit-address.use-case.ts`, `crypto-deposit-view.tsx` (QR via the
`qrcode` dep, rendered server-side, `bg-white` container for scan contrast
in dark mode). Removed by the UI/infra agents in parallel with this doc
update; comes back post-V0.
