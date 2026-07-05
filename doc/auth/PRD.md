# Auth — Product Requirements (PRD)

## Summary

Passwordless-first login for everyone: the user enters their mobile number,
receives a one-time code (OTP), and is routed by their **account status**.
Users who set a **two-step password** are asked for it after the OTP — a
second factor they own, with an identity-based reset. No usernames, no
mandatory passwords.

## Goals

- A first-time user reaches the platform with **two inputs** (phone, code).
- Security is opt-in and understandable: the two-step password is a plain
  concept («بعد از کد پیامکی، رمزت هم پرسیده می‌شود»).
- Fully RTL Persian, mobile-first; OTP boxes flow LTR (numeric convention).

## Non-goals (this tier)

- Email login, social login, passkeys/WebAuthn (biometric is a future factor
  for the two-step gate), device management, session list.

## Flow & statuses

1. **/login** — mobile number (validated `09xxxxxxxxx`, Persian digits
   accepted). Mock OTP is always **123456**.
2. **/login/verify** — 6 OTP boxes, auto-submit on the last digit, resend
   timer. On success the **login status** decides the destination:

| Status         | Destination |
| -------------- | ----------- |
| `registration` | `/kyc`      |
| `approved`     | `/market`   |
| `declined`     | `/declined` |

3. **/login/two-step** (only when a two-step password is set) — the password
   gate. Wrong password → calm inline error; «رمز را فراموش کرده‌اید؟» leads
   to the reset.

## Two-step password

- **Set** from حساب کاربری → ورود دومرحله‌ای: password + four live rules
  (≥۸ کاراکتر، حرف بزرگ، حرف کوچک، عدد) + retype. Rules re-checked
  server-side.
- **Reset** by matching **کد ملی** (checksum-validated) + **تاریخ تولد**
  (Jalali) + an SMS code, then a new rule-checked password.

## Mock behaviour

`09111111111` → approved · `09000000000` → declined · anything else →
registration. OTP/SMS codes are always `123456`.

## Key copy

«ورود به ناخدا» · «کد ۶ رقمی ارسال‌شده به شماره زیر را وارد کنید.» ·
«رمز دومرحله‌ای» · «رمز را فراموش کرده‌اید؟» — verbs-first, no jargon.
