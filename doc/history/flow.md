# History — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/wallet/history?type= ── ListTransactionsUseCase(type?) ─▶
   TransactionsRepository.listTransactions()
      │   (reads wallet.transactions in mock-wallet-state — the log that
      │    settleTrade / deposit / withdraw mocks append to)
      ▼
TransactionTimeline: group by Jalali day (امروز/دیروز/formatJalaliDay)
   └─ TransactionListItem: badge · title · time+status · ±amounts
```

## File map

- Domain: `lib/core/domain/wallet/transaction.ts` (`TransactionType`:
  deposit/withdraw/buy/sell — `reward` joins with the referral program).
- Port + use case: `transactions-repository.port.ts`,
  `list-transactions.use-case.ts` (sort desc + optional type filter).
- UI: `components/wallet/transaction-timeline.tsx` (day grouping),
  `transaction-list-item.tsx`, `transaction-filters.tsx` (link chips).
- Dates: `lib/utils/jalali.ts` — `formatJalaliDay` («۱۳ تیر ۱۴۰۵»),
  `formatTimeFa` («۰۹:۰۵»), both unit-tested.

## Notes

- Filters are links, not client state — server component + shareable URLs.
- Entry points: bottom-nav کیف پول → quick action تاریخچه, plus receipts
  («مشاهده تاریخچه») from deposit/withdraw/trade flows.
