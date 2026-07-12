"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { startLogin } from "@/app/actions/auth";
import { initialAuthFormState } from "@/app/actions/auth-state";

/**
 * Hero call-to-action: enter a mobile number to log in or register. Submits to
 * the `startLogin` server action, which requests an OTP (mock auth repo) and
 * redirects to verification. No card wrapper — the field and button stand on
 * their own so the hero doesn't read as a box-in-a-box.
 */
export function PhoneCtaCard() {
  const [state, formAction, pending] = useActionState(
    startLogin,
    initialAuthFormState,
  );

  return (
    <form
      action={formAction}
      className="flex w-full max-w-[380px] flex-col items-stretch gap-3"
    >
      <Field
        name="mobile"
        type="tel"
        inputMode="tel"
        dir="ltr"
        autoComplete="tel"
        label="شماره موبایل"
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        className="text-right"
        error={state.error}
      />
      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "در حال ارسال…" : "ورود یا ایجاد حساب"}
      </Button>
    </form>
  );
}
