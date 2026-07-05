"use client";

import { useActionState, useState } from "react";
import { startLogin } from "@/app/actions/auth";
import { initialAuthFormState } from "@/app/actions/auth-state";
import { isValidIranMobile } from "@/lib/utils/digits";
import { Button } from "@/components/ui/button";

export function PhoneLoginForm({ refCode }: { refCode?: string }) {
  const [state, formAction, pending] = useActionState(
    startLogin,
    initialAuthFormState,
  );
  const [mobile, setMobile] = useState("");
  const valid = isValidIranMobile(mobile);

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}
      <div className="flex w-full flex-col gap-2">
        <label
          htmlFor="mobile"
          className="text-right text-[14px] font-semibold text-muted"
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
          className="h-[60px] w-full rounded-[14px] border-[1.5px] border-line bg-paper px-4 text-center text-[18px] font-medium text-ink outline-none transition-colors placeholder:text-placeholder focus:border-brand"
        />
      </div>

      {state.error ? (
        <p className="text-right text-[13px] text-loss">{state.error}</p>
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
