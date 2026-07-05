"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { setTwoFactor } from "@/app/actions/account";
import { Button, buttonClasses } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { CheckCircleIcon, ShieldIcon } from "@/components/ui/icons";
import { maskMobile } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

type FormState =
  { status: "idle" | "success" } | { status: "error"; message: string };

/**
 * Two-step verification: explains the state, then confirms the change with an
 * SMS code (mock: 123456) using the same OTP boxes as login.
 */
export function TwoStepForm({
  enabled,
  mobile,
}: {
  enabled: boolean;
  mobile: string;
}) {
  const [step, setStep] = useState<"intro" | "otp">("intro");
  const [code, setCode] = useState("");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    setTwoFactor,
    { status: "idle" },
  );

  // Success — the profile row reflects the new state on the way back.
  if (state.status === "success") {
    const nowEnabled = !enabled;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <CheckCircleIcon size={64} className="text-brand" />
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] font-extrabold text-ink">
            ورود دومرحله‌ای {nowEnabled ? "فعال شد" : "غیرفعال شد"}
          </h1>
          <p className="max-w-[320px] text-[15px] leading-7 text-muted">
            {nowEnabled
              ? "از این پس هنگام ورود، یک کد پیامکی هم از شما خواسته می‌شود."
              : "از این پس ورود فقط با رمز یک‌بارمصرف انجام می‌شود."}
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

  if (step === "otp") {
    return (
      <form action={formAction} className="flex flex-1 flex-col gap-6">
        <p className="text-[15px] leading-7 text-muted">
          کد تأیید به شماره{" "}
          <span className="font-bold text-ink" dir="ltr">
            {maskMobile(mobile)}
          </span>{" "}
          پیامک شد. آن را وارد کنید. (نسخه آزمایشی: کد ۱۲۳۴۵۶)
        </p>
        <input type="hidden" name="enable" value={enabled ? "0" : "1"} />
        <OtpInput name="code" onChange={setCode} />
        {state.status === "error" ? (
          <p role="alert" className="text-[14px] font-bold text-loss">
            {state.message}
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-3">
          <Button
            type="submit"
            size="xl"
            fullWidth
            disabled={code.length !== 6 || pending}
          >
            {pending ? "در حال بررسی…" : "تأیید"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            disabled={pending}
            onClick={() => setStep("intro")}
          >
            بازگشت
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span
          aria-hidden
          className={cn(
            "flex size-20 items-center justify-center rounded-full",
            enabled ? "bg-brand/10 text-brand" : "bg-surface text-muted",
          )}
        >
          <ShieldIcon size={36} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-extrabold text-ink">
            ورود دومرحله‌ای {enabled ? "فعال است" : "غیرفعال است"}
          </h1>
          <p className="max-w-[320px] text-[15px] leading-7 text-muted">
            با فعال بودن ورود دومرحله‌ای، علاوه بر رمز یک‌بارمصرف، یک کد پیامکی
            هم هنگام ورود از شما خواسته می‌شود تا حساب شما امن‌تر بماند.
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <Button
          type="button"
          size="xl"
          fullWidth
          variant={enabled ? "ghost" : "primary"}
          className={enabled ? "bg-surface text-loss" : undefined}
          onClick={() => setStep("otp")}
        >
          {enabled ? "غیرفعال‌سازی" : "فعال‌سازی"}
        </Button>
      </div>
    </div>
  );
}
