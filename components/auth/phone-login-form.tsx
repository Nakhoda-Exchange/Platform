"use client";

import { useActionState, useState } from "react";
import { startLogin } from "@/app/actions/auth";
import { initialAuthFormState } from "@/app/actions/auth-state";
import { isValidIranMobile } from "@/lib/utils/digits";
import { Button } from "@/components/ui/button";

export function PhoneLoginForm() {
  const [state, formAction, pending] = useActionState(
    startLogin,
    initialAuthFormState,
  );
  const [mobile, setMobile] = useState("");
  const valid = isValidIranMobile(mobile);

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-2">
        <label
          htmlFor="mobile"
          className="text-right text-[14px] font-semibold text-slate-500"
        >
          شماره موبایل
        </label>
        <input
          id="mobile"
          name="mobile"
          type="tel"
          inputMode="tel"
          dir="ltr"
          autoComplete="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          className="h-[60px] w-full rounded-[14px] border-[1.5px] border-slate-200 bg-white px-4 text-center text-[18px] font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-brand"
        />
      </div>

      {state.error ? (
        <p className="text-right text-[13px] text-red-500">{state.error}</p>
      ) : null}

      <Button
        type="submit"
        size="xl"
        shape="rounded"
        fullWidth
        disabled={!valid || pending}
      >
        {pending ? "لطفاً صبر کنید…" : "دریافت کد تأیید"}
      </Button>
    </form>
  );
}
