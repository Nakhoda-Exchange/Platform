"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { verifyTwoStepLogin } from "@/app/actions/auth";
import { initialAuthFormState } from "@/app/actions/auth-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

/** The login gate: the user's two-step password, asked after the OTP. */
export function TwoStepLoginForm({ status }: { status: string }) {
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(
    verifyTwoStepLogin,
    initialAuthFormState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-8">
      <input type="hidden" name="st" value={status} />
      <Field
        name="password"
        type="password"
        label="رمز دومرحله‌ای"
        dir="ltr"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={state.error}
      />
      <div className="flex w-full flex-col items-center gap-4">
        <Button
          type="submit"
          size="xl"
          shape="rounded"
          fullWidth
          disabled={password.length === 0 || pending}
        >
          {pending ? "لطفاً صبر کنید…" : "ورود"}
        </Button>
        <Link
          href={`/login/two-step/reset?st=${encodeURIComponent(status)}`}
          className="text-[14px] font-bold text-brand"
        >
          رمز را فراموش کرده‌اید؟
        </Link>
      </div>
    </form>
  );
}
