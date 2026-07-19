"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmKyc } from "@/app/actions/kyc";
import { initialKycFormState } from "@/app/actions/kyc-state";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Identity } from "@/lib/core/domain/kyc/identity";

const readOnlyClass =
  "text-right font-semibold text-ink cursor-default focus:border-line";

/**
 * Confirm screen — the identity fields are read-only (they come from the server
 * inquiry, not the user). Confirming calls the backend to mark the user
 * KYC-verified; a failure is surfaced inline. "back" returns to re-enter.
 */
export function KycConfirmForm({ identity }: { identity: Identity }) {
  const [state, formAction, pending] = useActionState(
    confirmKyc,
    initialKycFormState,
  );
  return (
    <form action={formAction} className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-col gap-4">
        <Field
          label="نام"
          defaultValue={identity.firstName}
          readOnly
          className={readOnlyClass}
        />
        <Field
          label="نام خانوادگی"
          defaultValue={identity.lastName}
          readOnly
          className={readOnlyClass}
        />
        <Field
          label="نام پدر"
          defaultValue={identity.fatherName}
          readOnly
          className={readOnlyClass}
        />
      </div>

      {state.error ? (
        <p className="text-right text-[13px] text-loss">{state.error}</p>
      ) : null}

      <div className="flex w-full flex-col items-center gap-4">
        <Button
          type="submit"
          size="xl"
          shape="rounded"
          fullWidth
          disabled={pending}
        >
          تأیید و ادامه
        </Button>
        <Link
          href="/kyc"
          className="text-[15px] font-semibold text-muted transition-colors hover:text-ink"
        >
          بازگشت و ویرایش اطلاعات
        </Link>
      </div>
    </form>
  );
}
