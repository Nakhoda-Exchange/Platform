# Portfolio — Implementation flow

Product context: [`PRD.md`](./PRD.md).

## Flow

```
/wallet ── GetPortfolioUseCase ─▶ PortfolioRepository.getPortfolio() ─▶ GET /portfolio
   │           (total = cash + Σ holdings.valueIrt; 24h P&L from coin.change24h;
   │            money fields are decimal strings, parsed with parsePrice)
   ├─ PortfolioSummary (total, امروز pill, chart, quick-action grid)
   ├─ HoldingListItem × n ─▶ /market/[symbol]
   └─ PortfolioEmpty (no holdings) ─▶ /market · /wallet/deposit
```

## File map

- Domain: `lib/core/domain/portfolio/portfolio.ts` (`Holding`, `Portfolio`;
  money/quantity are decimal strings).
- Port + use case: `lib/core/application/portfolio/**` (use case computes
  total + day P&L; unit-tested).
- Adapter: `lib/infrastructure/portfolio/http-portfolio.repository.ts` — HTTP
  `GET /portfolio` + `GET /portfolio/history`. (The old
  `mock-wallet-state.ts` / `settleTrade()` shared store no longer exists; trade
  balances are derived from this same `/portfolio` snapshot.)
- UI: `components/portfolio/*`; quick actions link to
  `/wallet/deposit`, `/wallet/withdraw`, `/market`, `/wallet/history`.

## Notes

- The quick-action row is a 2×2 grid on purpose: four xl pills in one flex
  row overflowed a 390px viewport (see PR #45).
- **Balance lock (#73)**: `availableIrt` is contractually `total − locked −
pendingWithdraw`. Only the fiat-withdraw lock (`pendingWithdrawIrt`) is
  surfaced today; the open-order reserve (`locked`) is a required follow-up to
  close the double-spend window — see `doc/portfolio/api.md`.
