# Bank accounts — Implementation flow

Product context: [`PRD.md`](./PRD.md). API contract: [`api.md`](./api.md).

## Flow

```
/account  ── AccountMenu row «حساب‌های بانکی»
      ▼
/account/bank-accounts  (server component)
      │  Promise.all:
      │    GetProfileUseCase.execute()      ─▶ UserRepository.getProfile()      (kycVerified)
      │    ManageCardsUseCase.list()        ─▶ WalletRepository.listCards()
      │    ManageIbansUseCase.list()        ─▶ WalletRepository.listIbans()
      ▼
BankAccountsManager (client)  — two tabs, cards / IBANs
      │
      │  kycVerified = false ─▶ same «تکمیل احراز هویت» CTA as the account hub, no add/manage UI
      │
      ├─ add(number) ──────────▶ addCard(number) / addIban(value)          [app/actions/bank-account.ts]
      │                              │
      │                              ▼
      │                        ManageCardsUseCase.add / ManageIbansUseCase.add
      │                              │  1. normalize + format-check (Luhn / mod-97) — domain
      │                              │     fail INVALID_CARD / INVALID_IBAN, no network call
      │                              │  2. KYC ownership gate ─▶ BankInquiryPort.verifyCard/verifyIban
      │                              │     fail NOT_OWNER — nothing saved
      │                              │  3. WalletRepository.addCard/addIban(normalized, ownerName)
      │                              ▼
      │                        BankCard / Iban { id, ownerName, primary, status }
      │
      ├─ setPrimary(id) ───────▶ setPrimaryCard(id) / setPrimaryIban(id) ─▶ WalletRepository.setPrimary*
      │
      └─ remove(id) ───────────▶ removeCard(id) / removeIban(id) ─▶ WalletRepository.remove*
```

The **KYC ownership gate** is the one step this feature adds beyond a plain
CRUD list: adding an instrument always routes through `BankInquiryPort`
(owned by the `kyc` feature — see `doc/kyc/api.md`) before the wallet
repository ever persists it. `ManageCardsUseCase`/`ManageIbansUseCase` depend
on **both** ports; nothing is saved unless the inquiry confirms the KYC'd
user is the registered holder.

## Layering (clean architecture, per `CLAUDE.md`)

1. **Domain**
   - `lib/core/domain/wallet/bank-card.ts` — `BankCard` entity,
     `normalizeCardNumber` (Persian digits/spaces/dashes → 16 digits),
     `isValidCardNumber` (Luhn).
   - `lib/core/domain/wallet/bank-account.ts` — `Iban` entity,
     `BankAccountStatus` (`"verified" | "pending"`), `normalizeIban`,
     `isValidIban` (ISO 13616 / mod-97), and `sameOwner` (lenient Persian
     name comparison — collapses ZWNJ/whitespace, then exact match) used by
     the inquiry adapters to decide the ownership match.
2. **Application**
   - `lib/core/application/wallet/ports/wallet-repository.port.ts` — the
     card/IBAN half: `listCards`/`addCard`/`setPrimaryCard`/`removeCard` and
     the `*Iban` equivalents.
   - `lib/core/application/kyc/ports/bank-inquiry.port.ts` —
     `BankInquiryPort.verifyCard`/`verifyIban`, returning
     `{ ownerName }` or failing `NOT_OWNER`. This port belongs to the `kyc`
     feature (it's the ownership-inquiry half of KYC, alongside identity
     inquiry) but is consumed here.
   - `lib/core/application/wallet/use-cases/manage-cards.use-case.ts`,
     `manage-ibans.use-case.ts` — each takes `(WalletRepository,
BankInquiryPort)`; `add()` runs format-check → ownership inquiry →
     persist, in that order, short-circuiting on the first failure.
3. **Infrastructure**
   - `lib/infrastructure/wallet/http-wallet.repository.ts` — real adapter
     for the card/IBAN CRUD endpoints.
   - `lib/infrastructure/kyc/http-bank-inquiry.repository.ts` — real
     adapter for the two inquiry endpoints.
   - Mocks (in-memory, per-process, until the backend lands):
     `lib/infrastructure/wallet/mock-wallet.repository.ts` (`CARDS`/`IBANS`
     arrays; first-added is primary; removing primary promotes the next);
     `lib/infrastructure/kyc/mock-bank-inquiry.repository.ts` — **any
     instrument whose digits end in `0000` is treated as belonging to
     someone else** (`زهرا محمدی` vs. the mock KYC holder `علی رضایی`) —
     this is the documented trigger to exercise the `NOT_OWNER` path in
     manual/E2E testing; every other number resolves to the account holder.
4. **DI** — `lib/di/container.instance.ts` binds `TOKENS.WalletRepository`,
   `TOKENS.BankInquiryPort`, `TOKENS.ManageCardsUseCase`,
   `TOKENS.ManageIbansUseCase`. Swapping mock → HTTP is a registration
   change only, per feature (`API_BASE_URL` set ⇒ `Http*`).
5. **Presentation**
   - Route: `app/(platform)/account/bank-accounts/page.tsx` — server
     component, resolves `GetProfileUseCase` + both `list()` calls in
     parallel, passes `kycVerified` + initial lists into a client
     `BankAccountsManager` (component under `components/account/`, built by
     the UI workstream — not documented here since it doesn't exist yet).
   - Actions: `app/actions/bank-account.ts` (`"use server"`, thin —
     resolve the use case, `.execute()`/call, map `Result` to
     `{ ok: true, data }` / `{ ok: false, message }`); types in the sibling
     `app/actions/bank-account-state.ts` (`AddCardResult`, `AddIbanResult`,
     `MutateResult`).

## Things to consider

- **Never edit a saved number** — remove + re-add is the only path; actions
  intentionally expose no "update" call.
- **No name input anywhere** — `ownerName` always comes from
  `BankInquiryPort`, never typed by the user or accepted from the client on
  add (the use case ignores any client-supplied name and calls
  `wallet.addCard/addIban` with the inquiry's `ownerName`).
- **Primary invariant** — a non-empty list always has exactly one primary;
  mock enforces it in `repoint()`. A real adapter must preserve the same
  invariant (e.g. a DB constraint or transactional repoint), since
  deposit/withdraw trust `primary` to pre-select without a fallback scan.
- **Digits**: convert Persian↔Latin with `lib/utils/digits.ts` on input —
  same convention as KYC.
- **Verify on WebKit + Chromium**, RTL number entry (`dir="ltr"` on the
  numeric fields).
