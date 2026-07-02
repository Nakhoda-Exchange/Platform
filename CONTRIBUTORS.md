# Contributing to Nakhoda

Thanks for contributing! This document describes our **branching** and **commit** conventions. They are enforced automatically where possible (a Husky pre-commit hook runs Prettier + ESLint on staged files).

## Golden rule: never commit directly to `main`

`main` is protected and always deployable. **Every feature, fix, or change lives on its own branch** and is merged into `main` via a Pull Request.

```bash
git checkout main
git pull                      # start from the latest main
git checkout -b feat/otp-verification
# ...work, commit...
git push -u origin feat/otp-verification
# open a Pull Request into main
```

## Branch naming

Use `<type>/<short-kebab-case-description>`. The `<type>` matches the commit types below.

```
feat/phone-login
fix/safari-otp-autofill
refactor/auth-di-container
docs/contributing-guide
chore/husky-prettier
```

Rules:

- Lowercase, words separated by hyphens (`-`).
- Keep it short and descriptive; reference an issue id when relevant (`feat/123-otp-verification`).
- One branch per logical change — don't mix unrelated work.

## Commit messages — Conventional Commits

Format:

```
<type>(<optional-scope>): <subject>

<optional body>

<optional footer>
```

Example:

```
feat(auth): add OTP verification screen

Adds the 6-digit OTP input with auto-advance and auto-submit, wired to
the verify-otp use case through the DI container.

Refs: #42
```

### Types

| Type       | When to use                                                      |
| ---------- | ---------------------------------------------------------------- |
| `feat`     | A new feature                                                    |
| `fix`      | A bug fix                                                        |
| `refactor` | Code change that neither fixes a bug nor adds a feature          |
| `perf`     | A performance improvement                                        |
| `style`    | Formatting only (whitespace, semicolons) — no logic change       |
| `docs`     | Documentation only                                               |
| `test`     | Adding or fixing tests                                           |
| `build`    | Build system, dependencies, or tooling (Husky, Prettier, config) |
| `ci`       | CI configuration                                                 |
| `chore`    | Maintenance that doesn't fit above                               |
| `revert`   | Reverts a previous commit                                        |

### Rules

- **Subject**: imperative mood ("add", not "added"/"adds"), lowercase, no trailing period, ≤ 72 characters.
- **Scope** is optional and names the area touched: `auth`, `landing`, `ui`, `di`, `deps`.
- **Body** (optional) explains _what_ and _why_, not _how_; wrap at ~72 columns.
- **Breaking changes**: add a `!` after the type/scope and a `BREAKING CHANGE:` footer.

  ```
  refactor(auth)!: replace repository singleton with DI container

  BREAKING CHANGE: data access now resolves through the DI container.
  ```

## Before you push

The pre-commit hook auto-formats and lints staged files, but run these before opening a PR:

```bash
bun run lint         # ESLint
npx tsc --noEmit     # type-check
bun run format       # format everything (optional; the hook covers staged files)
```

**Verify UI changes on both mobile Safari (WebKit) and Chrome** — the app is mobile-first and RTL, and Safari has caught issues Chrome did not.

## Pull Requests

Open your PR against `main`. Opening one auto-populates the description from
[`.github/pull_request_template.md`](.github/pull_request_template.md) — fill it
in and complete the checklist. Keep PRs focused: one logical change per PR.

## Branch protection (maintainers)

`main` should be protected on GitHub so the rules above are enforced, not just
documented. In **Settings → Branches → Add branch ruleset** (or _Branch
protection rules_) for `main`, enable:

- **Require a pull request before merging** — with at least **1 approval**.
- **Require status checks to pass** — add `lint` and `type-check` once CI runs them.
- **Require branches to be up to date before merging**.
- **Require linear history** (no merge commits) — squash or rebase merges only.
- **Do not allow force pushes** and **do not allow deletions**.
- **Include administrators** (apply the rules to everyone).

A maintainer can apply an equivalent baseline via the API:

```bash
gh api -X PUT repos/Nakhoda-Exchange/Platform/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

> Once CI is set up, replace `"required_status_checks": null` with
> `{ "strict": true, "contexts": ["lint", "type-check"] }`.
