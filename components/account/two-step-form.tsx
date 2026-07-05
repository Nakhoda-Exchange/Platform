"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { setTwoStepPassword } from "@/app/actions/account";
import type { TwoStepFormState } from "@/app/actions/account-state";
import { isStrongPassword } from "@/lib/core/domain/account/two-step-password";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordChecks } from "./password-checks";
import { CheckCircleIcon, ShieldIcon } from "@/components/ui/icons";

/**
 * Two-step password setup: password + the four live rule checks, then a
 * retype field. Once set, login asks for this password after the OTP; a
 * forgotten password resets via national code + birth date + SMS code.
 */
export function TwoStepForm({ enabled }: { enabled: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState<
    TwoStepFormState,
    FormData
  >(setTwoStepPassword, { status: "idle" });

  const strong = isStrongPassword(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const valid = strong && confirm === password && confirm.length > 0;

  if (state.status === "success") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <CheckCircleIcon size={64} className="text-brand" />
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] font-extrabold text-ink">
            رمز دومرحله‌ای تنظیم شد
          </h1>
          <p className="max-w-[320px] text-[15px] leading-7 text-muted">
            از این پس هنگام ورود، بعد از کد پیامکی این رمز هم از شما خواسته
            می‌شود.
          </p>
        </div>
        <Link
          href="/account"
          className={buttonClasses({
            size: "lg",
            fullWidth: true,
            className: "max-w-[360px]",
          })}
        >
          بازگشت به حساب کاربری
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span
          aria-hidden
          className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand"
        >
          <ShieldIcon size={30} />
        </span>
        <p className="max-w-[330px] text-[15px] leading-7 text-muted">
          {enabled
            ? "رمز دومرحله‌ای فعال است. برای تغییر، رمز تازه‌ای تنظیم کنید."
            : "با تنظیم این رمز، هنگام ورود بعد از کد پیامکی، رمز شما هم پرسیده می‌شود تا حساب امن‌تر بماند."}
        </p>
      </div>

      <Field
        name="password"
        type="password"
        label="رمز دومرحله‌ای"
        dir="ltr"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <PasswordChecks password={password} />

      <Field
        name="confirm"
        type="password"
        label="تکرار رمز"
        dir="ltr"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={
          mismatch
            ? "تکرار رمز با رمز یکسان نیست."
            : state.status === "error"
              ? state.message
              : null
        }
      />

      <div className="mt-auto flex flex-col gap-3">
        <Button type="submit" size="xl" fullWidth disabled={!valid || pending}>
          {pending
            ? "در حال ذخیره…"
            : enabled
              ? "تغییر رمز"
              : "فعال‌سازی رمز دومرحله‌ای"}
        </Button>
        {enabled ? (
          <Link
            href="/account/two-step/reset"
            className="text-center text-[14px] font-bold text-brand"
          >
            رمز را فراموش کرده‌اید؟ بازنشانی
          </Link>
        ) : null}
      </div>
    </form>
  );
}
