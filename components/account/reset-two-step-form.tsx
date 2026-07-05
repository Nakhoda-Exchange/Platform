"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetTwoStepPassword } from "@/app/actions/account";
import type { TwoStepFormState } from "@/app/actions/account-state";
import { isStrongPassword } from "@/lib/core/domain/account/two-step-password";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordChecks } from "./password-checks";
import { CheckCircleIcon } from "@/components/ui/icons";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { maskJalaliDate } from "@/lib/utils/jalali";

/**
 * Forgotten two-step password: identity match (national code + birth date) +
 * SMS code (mock 123456), then the new password with the same live rule
 * checks. Used from the account settings AND the login gate («فراموشی رمز») —
 * `doneHref` decides where the success CTA returns to.
 */
export function ResetTwoStepForm({
  doneHref,
  doneLabel,
}: {
  doneHref: string;
  doneLabel: string;
}) {
  const [nationalCode, setNationalCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState<
    TwoStepFormState,
    FormData
  >(resetTwoStepPassword, { status: "idle" });

  const mismatch = confirm.length > 0 && confirm !== password;
  const valid =
    toEnglishDigits(nationalCode).replace(/\D/g, "").length === 10 &&
    birthDate.length >= 8 &&
    code.length === 6 &&
    isStrongPassword(password) &&
    confirm === password;

  if (state.status === "success") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <CheckCircleIcon size={64} className="text-brand" />
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] font-extrabold text-ink">
            رمز تازه تنظیم شد
          </h1>
          <p className="max-w-[320px] text-[15px] leading-7 text-muted">
            از این پس با رمز تازه وارد شوید.
          </p>
        </div>
        <Link
          href={doneHref}
          className={buttonClasses({
            size: "lg",
            fullWidth: true,
            className: "max-w-[360px]",
          })}
        >
          {doneLabel}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-5">
      <p className="text-[15px] leading-7 text-muted">
        برای بازنشانی رمز، هویت خود را تأیید کنید: کد ملی و تاریخ تولد شما باید
        با حساب یکی باشد و کد پیامکی را وارد کنید. (نسخه آزمایشی: کد ۱۲۳۴۵۶)
      </p>

      <Field
        name="nationalCode"
        label="کد ملی"
        inputMode="numeric"
        dir="ltr"
        placeholder="۰۰۱۲۳۴۵۶۷۸"
        value={toPersianDigits(nationalCode)}
        onChange={(e) =>
          setNationalCode(
            toEnglishDigits(e.target.value).replace(/\D/g, "").slice(0, 10),
          )
        }
      />

      <Field
        name="birthDate"
        label="تاریخ تولد (شمسی)"
        inputMode="numeric"
        dir="ltr"
        placeholder="۱۳۷۵/۰۶/۱۵"
        value={birthDate}
        onChange={(e) => setBirthDate(maskJalaliDate(e.target.value))}
      />

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink">کد پیامکی</span>
        <OtpInput name="code" onChange={setCode} autoFocus={false} />
      </div>

      <Field
        name="password"
        type="password"
        label="رمز تازه"
        dir="ltr"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordChecks password={password} />
      <Field
        name="confirm"
        type="password"
        label="تکرار رمز تازه"
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

      <div className="mt-auto">
        <Button type="submit" size="xl" fullWidth disabled={!valid || pending}>
          {pending ? "در حال بررسی…" : "بازنشانی رمز"}
        </Button>
      </div>
    </form>
  );
}
