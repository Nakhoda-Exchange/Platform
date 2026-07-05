"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { resetTwoStepPassword } from "@/app/actions/account";
import type { TwoStepFormState } from "@/app/actions/account-state";
import { isStrongPassword } from "@/lib/core/domain/account/two-step-password";
import { isValidNationalCode } from "@/lib/core/domain/kyc/national-code";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { JalaliDateField } from "@/components/ui/jalali-date-field";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordChecks } from "./password-checks";
import { CheckCircleIcon } from "@/components/ui/icons";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { isValidJalaliDate } from "@/lib/utils/jalali";
import { cn } from "@/lib/utils/cn";

const STEPS = ["هویت", "کد پیامکی", "رمز تازه"] as const;

/** Which step a server-side rejection belongs to. */
function stepForError(code?: string): number {
  if (code === "INVALID_NATIONAL_CODE" || code === "INVALID_BIRTHDATE")
    return 0;
  if (code === "INVALID_CODE") return 1;
  return 2;
}

/**
 * Forgotten two-step password, KYC-style steps: 1) identity (national code +
 * Jalali birth date) → 2) SMS code (mock 123456) → 3) the new password with
 * the live rule checks + retype. One <form> — earlier steps stay mounted
 * (hidden) so every value posts together; a server rejection jumps back to
 * the offending step.
 */
export function ResetTwoStepForm({
  doneHref,
  doneLabel,
}: {
  doneHref: string;
  doneLabel: string;
}) {
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [nationalCode, setNationalCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState<
    TwoStepFormState,
    FormData
  >(resetTwoStepPassword, { status: "idle" });

  // A server rejection sends the user back to the step that failed —
  // adjusted during render (React's derived-state pattern), not in an effect.
  const [handledError, setHandledError] = useState<TwoStepFormState | null>(
    null,
  );
  if (state !== handledError && state.status === "error") {
    setHandledError(state);
    setStep(stepForError(state.code));
  }

  const identityValid =
    isValidNationalCode(nationalCode) && isValidJalaliDate(birthDate);
  const mismatch = confirm.length > 0 && confirm !== password;
  const passwordValid = isStrongPassword(password) && confirm === password;
  const serverError = state.status === "error" ? state.message : null;

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
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-1 flex-col gap-6"
    >
      {/* Stepper */}
      <ol
        className="flex items-center justify-between gap-2"
        aria-label="مراحل"
      >
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-[13px] font-bold",
                i < step
                  ? "bg-brand/10 text-brand"
                  : i === step
                    ? "bg-brand text-white"
                    : "bg-surface text-placeholder",
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {toPersianDigits(i + 1)}
            </span>
            <span
              className={cn(
                "text-[12px]",
                i === step ? "font-bold text-ink" : "text-muted",
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Step 1 — identity */}
      <div className={cn("flex flex-col gap-5", step !== 0 && "hidden")}>
        <p className="text-[15px] leading-7 text-muted">
          برای بازنشانی رمز، اول هویت خود را تأیید کنید. کد ملی و تاریخ تولد
          باید با حساب شما یکی باشد.
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
          error={step === 0 ? serverError : null}
        />
        <JalaliDateField
          label="تاریخ تولد (شمسی)"
          name="birthDate"
          value={birthDate}
          onChange={setBirthDate}
        />
      </div>

      {/* Step 2 — SMS code */}
      <div className={cn("flex flex-col gap-5", step !== 1 && "hidden")}>
        <p className="text-[15px] leading-7 text-muted">
          کد پیامک‌شده را وارد کنید. (نسخه آزمایشی: کد ۱۲۳۴۵۶)
        </p>
        <OtpInput name="code" onChange={setCode} autoFocus={false} />
        {step === 1 && serverError ? (
          <p role="alert" className="text-[14px] font-bold text-loss">
            {serverError}
          </p>
        ) : null}
      </div>

      {/* Step 3 — new password */}
      <div className={cn("flex flex-col gap-5", step !== 2 && "hidden")}>
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
              : step === 2
                ? serverError
                : null
          }
        />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {/* Both CTAs are type="button": morphing one node into type="submit"
            mid-click makes the browser's activation behavior submit the form
            with the click that only meant to advance a step. */}
        {step < 2 ? (
          <Button
            type="button"
            size="xl"
            fullWidth
            disabled={step === 0 ? !identityValid : code.length !== 6}
            onClick={() => setStep(step + 1)}
          >
            ادامه
          </Button>
        ) : (
          <Button
            type="button"
            size="xl"
            fullWidth
            disabled={!passwordValid || pending}
            onClick={() => formRef.current?.requestSubmit()}
          >
            {pending ? "در حال بررسی…" : "بازنشانی رمز"}
          </Button>
        )}
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            disabled={pending}
            onClick={() => setStep(step - 1)}
          >
            بازگشت
          </Button>
        ) : null}
      </div>
    </form>
  );
}
