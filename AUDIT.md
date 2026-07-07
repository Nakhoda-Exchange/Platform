# Nakhoda App Audit

## Scope

This audit reviews the current main-branch experience across the landing, auth, KYC, market, wallet, account, and platform shell flows.

## Verification

- Build: verified with `bun run build`
- Lint: verified with `bun run lint`
- Result: both completed successfully on the current main branch

## Overall assessment

The app already has a strong visual foundation, a consistent RTL/mobile shell, and a generally polished presentation. The biggest remaining gaps are not visual polish but product trust, clarity of core actions, and the perception of completeness.

## Top issues

### 1. Authentication and post-login flow is brittle

- The login and OTP flow relies on URL state for challenge and status transport.
- Declined users are sent to a dead-end page with no recovery path.
- Impact: weakens trust and creates support overhead in a financial product.
- Recommendation: move sensitive state into a server-side session or signed cookie and replace the declined route with a clear pending/review experience.

### 2. Some product areas look finished when they are still incomplete

- The account menu exposes several areas as if they were ready.
- Impact: users may assume the product is complete even when key flows are not yet available.
- Recommendation: hide unfinished items behind “به‌زودی” states or finish the flows before surfacing them as first-class navigation.

### 3. Core trading actions are not obvious enough

- Buying and selling are hidden behind gestures and secondary steps rather than being obvious primary actions.
- Impact: the app’s core value is harder to discover and less convincing to first-time users.
- Recommendation: make buy/sell entry points visible from the market and portfolio surfaces.

### 4. KYC explains the form but not the purpose

- The KYC screen tells users what to enter, but not why it is needed, what happens next, or how long it will take.
- Impact: verification feels like friction instead of a trusted step.
- Recommendation: add concise reassurance, expected timing, and a plain-language explanation of the benefits.

### 5. Empty and failure states are too generic

- Empty states and error screens do not provide enough next-step guidance.
- Impact: users may think the app is broken or incomplete.
- Recommendation: add contextual recovery actions like “واریز تومان”, “خرید رمزارز”, or “بازنشانی فیلتر”.

### 6. Placeholder links reduce confidence

- Some support and policy links are still effectively placeholder-driven.
- Impact: weakens the perception of readiness.
- Recommendation: either ship those experiences or hide them until they are available.

### 7. The app still feels partially mock-driven in a way users may notice

- The implementation clearly uses mock infrastructure and explicit mock comments.
- Impact: this can undermine trust if the product is presented as a real service before backend integration is complete.
- Recommendation: add an explicit MVP/demo banner and keep the UI messaging aligned with the current product maturity.

## What is working well

- Clean, consistent visual language
- Strong RTL Persian usability on mobile
- Coherent app shell and bottom navigation
- Good build and lint health

## Priority recommendations

1. Improve the auth/session story for security and trust
2. Make buy/sell actions more obvious
3. Strengthen KYC clarity and reassurance
4. Replace placeholder behavior with real flows or clear disabled states
5. Add stronger empty-state and recovery guidance

## Suggested next steps

- Implement the highest-priority UX improvements in focused branches
- Add a small set of end-to-end product tests for onboarding, KYC, and trading entry points
- Prepare a follow-up audit after the next major product milestone
