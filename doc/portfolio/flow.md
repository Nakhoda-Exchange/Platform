# Portfolio — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/wallet ── GetPortfolioUseCase ─▶ PortfolioRepository.getPortfolio()
   │           (total = Σ holdings; 24h P&L derived from coin.change24h)
   │           reads lib/infrastructure/portfolio/mock-wallet-state.ts —
   │           the SAME store trade/deposit/withdraw mutate
   ├─ PortfolioSummary (total, امروز pill, chart, quick-action grid)
   ├─ HoldingListItem × n ─▶ /market/[symbol]
   └─ PortfolioEmpty (no holdings) ─▶ /market · /wallet/deposit
```

## File map

- Domain: `lib/core/domain/portfolio/portfolio.ts` (`Holding`, `Portfolio`).
- Port + use case: `lib/core/application/portfolio/**` (use case computes
  total + day P&L; unit-tested).
- Shared state: `lib/infrastructure/portfolio/mock-wallet-state.ts` — cash,
  holdings, transactions; `settleTrade()` and the deposit/withdraw mocks
  mutate it.
- UI: `components/portfolio/*`; quick actions link to
  `/wallet/deposit`, `/wallet/withdraw`, `/market`, `/wallet/history`.

## Notes

- The quick-action row is a 2×2 grid on purpose: four xl pills in one flex
  row overflowed a 390px viewport (see PR #45).
