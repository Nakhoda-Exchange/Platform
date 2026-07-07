# Feature docs

Every feature has a pair: **`PRD.md`** (what and why — product behaviour,
goals, non-goals, copy) and **`flow.md`** (how — the flow diagram, file map,
implementation notes). Keep them in sync with the code they describe.

| Feature                            | Docs                         |
| ---------------------------------- | ---------------------------- |
| Login, OTP, two-step password      | [`auth/`](./auth/)           |
| Identity verification (احراز هویت) | [`kyc/`](./kyc/)             |
| Market discovery, search, PDP      | [`market/`](./market/)       |
| Buy/sell (معامله)                  | [`trade/`](./trade/)         |
| Wallet home (کیف پول)              | [`portfolio/`](./portfolio/) |
| Deposit (واریز)                    | [`deposit/`](./deposit/)     |
| Withdraw (برداشت)                  | [`withdraw/`](./withdraw/)   |
| Transactions timeline (تاریخچه)    | [`history/`](./history/)     |
| Account hub (حساب کاربری)          | [`account/`](./account/)     |
| Dark/light theme (حالت نمایش)      | [`theme/`](./theme/)         |
| Referral program (کد دعوت)         | [`referral/`](./referral/)   |

Backend integration: every feature also has an **`api.md`** — the endpoint
contract its HTTP adapter implements (shared rules in
[`api-conventions.md`](./api-conventions.md)). With `API_BASE_URL` set the
app binds to those endpoints; without it, the in-memory mocks serve.

Conventions for all features: `CLAUDE.md` (architecture), `DESIGN.md`
(tokens/visual), `COMPONENTS.md` (component catalog).
