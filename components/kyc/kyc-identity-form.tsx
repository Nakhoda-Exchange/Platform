"use client";

import { useActionState, useState } from "react";
import { submitIdentity } from "@/app/actions/kyc";
import { initialKycFormState } from "@/app/actions/kyc-state";
import { isValidNationalCode } from "@/lib/core/domain/kyc/national-code";
import { isValidJalaliDate } from "@/lib/utils/jalali";
import { Field } from "@/components/ui/field";
import { JalaliDateField } from "@/components/ui/jalali-date-field";
import { Button } from "@/components/ui/button";

export function KycIdentityForm() {
  const [state, formAction, pending] = useActionState(
    submitIdentity,
    initialKycFormState,
  );
  const [nationalCode, setNationalCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const valid =
    isValidNationalCode(nationalCode) && isValidJalaliDate(birthDate);

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-4">
        <Field
          label="کد ملی"
          name="nationalCode"
          value={nationalCode}
          onChange={(e) => setNationalCode(e.target.value)}
          inputMode="numeric"
          dir="ltr"
          maxLength={10}
          placeholder="۰۰۱۲۳۴۵۶۷۸"
          className="text-right"
        />
        <JalaliDateField
          label="تاریخ تولد (شمسی)"
          name="birthDate"
          value={birthDate}
          onChange={setBirthDate}
        />
        <Field
          label="کد دعوت (اختیاری)"
          name="inviteCode"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          dir="ltr"
          maxLength={6}
          placeholder="مثلاً A1B2C3"
          className="text-right"
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
        {pending ? "لطفاً صبر کنید…" : "استعلام و ادامه"}
      </Button>
    </form>
  );
}
