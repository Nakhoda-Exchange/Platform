"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { startLogin } from "@/app/actions/auth";
import { initialAuthFormState } from "@/app/actions/auth-state";

/**
 * Hero call-to-action: enter a mobile number to log in or register. Submits to
 * the `startLogin` server action, which requests an OTP (mock auth repo) and
 * redirects to the verification screen.
 */
export function PhoneCtaCard() {
  const [state, formAction, pending] = useActionState(
    startLogin,
    initialAuthFormState,
  );

  return (
    <Card className="w-full max-w-[400px] p-5 shadow-[0_8px_12px_rgba(0,0,0,0.03)]">
      <form action={formAction} className="flex flex-col items-stretch gap-5">
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
    </Card>
  );
}
