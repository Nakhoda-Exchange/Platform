"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { verifyLogin } from "@/app/actions/auth";
import { initialAuthFormState } from "@/app/actions/auth-state";
import { Button } from "@/components/ui/button";
import { OtpInput } from "./otp-input";
import { ResendTimer } from "./resend-timer";

interface OtpVerifyFormProps {
  cid: string;
  phone: string;
  length?: number;
  resendSeconds?: number;
}

export function OtpVerifyForm({
  cid,
  phone,
  length = 6,
  resendSeconds = 120,
}: OtpVerifyFormProps) {
  const [state, formAction, pending] = useActionState(
    verifyLogin,
    initialAuthFormState,
  );
  const [code, setCode] = useState("");
  const complete = code.length === length;
  const formRef = useRef<HTMLFormElement>(null);
  const submittedCode = useRef("");

  // Auto-submit once the final digit lands. Runs after render so the hidden
  // `code` field is already up to date. Guarded so the same code isn't
  // resubmitted (e.g. after a failed attempt) until the user edits it.
  useEffect(() => {
    if (complete && code !== submittedCode.current) {
      submittedCode.current = code;
      formRef.current?.requestSubmit();
    }
  }, [complete, code]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-col gap-10"
    >
      <div className="flex w-full flex-col gap-4">
        <OtpInput length={length} onChange={setCode} />
        {state.error ? (
          <p className="text-center text-[13px] text-red-500">{state.error}</p>
        ) : null}
        <ResendTimer seconds={resendSeconds} phone={phone} />
      </div>

      <input type="hidden" name="cid" value={cid} />

      <div className="flex w-full flex-col items-center gap-4">
        <Button
          type="submit"
          size="xl"
          shape="rounded"
          fullWidth
          disabled={!complete || pending}
        >
          {pending ? "لطفاً صبر کنید…" : "ورود به ناخدا"}
        </Button>
        <Link
          href="/login"
          className="text-[15px] font-semibold text-slate-500 transition-colors hover:text-slate-700"
        >
          ویرایش شماره موبایل
        </Link>
      </div>
    </form>
  );
}
