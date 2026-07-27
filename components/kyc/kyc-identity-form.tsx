"use client";

import { useActionState, useState } from "react";
import { submitIdentity } from "@/app/actions/kyc";
import { initialKycFormState } from "@/app/actions/kyc-state";
import { isValidNationalCode } from "@/lib/core/domain/kyc/national-code";
import { isValidJalaliDate } from "@/lib/utils/jalali";
import { Field } from "@/components/ui/field";
import { JalaliDateField } from "@/components/ui/jalali-date-field";
import { Button } from "@/components/ui/button";

/**
 * `inviteRequired` mirrors the backend's invite-only mode: when on, registration
 * is closed to anyone without a code, so the field becomes mandatory and submit
 * stays disabled until it is filled.
 */
export function KycIdentityForm({
  inviteRequired = false,
}: {
  inviteRequired?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    submitIdentity,
    initialKycFormState,
  );
  const [nationalCode, setNationalCode] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const valid =
    isValidNationalCode(nationalCode) &&
    isValidJalaliDate(birthDate) &&
    (!inviteRequired || inviteCode.trim().length > 0);

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
          label={inviteRequired ? "کد دعوت" : "کد دعوت یا هدیه (اختیاری)"}
          name="inviteCode"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          dir="ltr"
          maxLength={32}
          placeholder="NOWRUZ"
          className="text-right uppercase"
        />
        <p className="text-right text-[13px] leading-[1.7] text-muted">
          {inviteRequired
            ? "ثبت‌نام در حال حاضر فقط با کد دعوت امکان‌پذیر است."
            : "اگر کد دعوت یا هدیه دارید وارد کنید تا جایزه‌اش به کیف پول شما اضافه شود."}
        </p>
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
