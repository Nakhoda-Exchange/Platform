"use client";

import { useActionState, useState } from "react";
import { redeemIncentiveCode } from "@/app/actions/incentives";
import { initialRedeemFormState } from "@/app/actions/incentives-state";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatCoinAmount, formatIrt } from "@/lib/utils/money";
import type { RedeemedIncentive } from "@/lib/core/domain/incentives/incentive";

/**
 * Redeem a gift/invite code from the account area — the path for a user who
 * already has an account (a code typed at signup is handled during KYC).
 */
export function RedeemCodeForm() {
  const [state, formAction, pending] = useActionState(
    redeemIncentiveCode,
    initialRedeemFormState,
  );
  const [code, setCode] = useState("");

  if (state.redeemed) return <RedeemedCard incentive={state.redeemed} />;

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <Field
        label="کد هدیه یا دعوت"
        name="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        dir="ltr"
        maxLength={32}
        placeholder="NOWRUZ"
        className="text-right uppercase"
      />

      {state.error ? (
        <p className="text-right text-[13px] text-loss">{state.error}</p>
      ) : null}

      <Button
        type="submit"
        size="xl"
        shape="rounded"
        fullWidth
        disabled={pending || code.trim().length === 0}
      >
        {pending ? "لطفاً صبر کنید…" : "ثبت کد"}
      </Button>
    </form>
  );
}

/**
 * The outcome. An `instant` code is already in the wallet; a deferred one names
 * the milestone the user still has to reach, so nobody is left wondering where
 * their reward went.
 */
function RedeemedCard({ incentive }: { incentive: RedeemedIncentive }) {
  const isIrt = incentive.asset === "irt";
  const amount = isIrt
    ? formatIrt(incentive.amount)
    : `${formatCoinAmount(incentive.amount)} ${incentive.symbol}`;

  return (
    <div className="flex w-full flex-col gap-3 rounded-card border border-line bg-surface p-5 text-right">
      <p className="text-[15px] font-bold text-ink">کد با موفقیت ثبت شد.</p>
      <p className="text-[15px] text-ink">
        جایزه شما: <span className="font-bold text-brand">{amount}</span>
      </p>
      <p className="text-[14px] leading-[1.7] text-muted">
        {incentive.credited
          ? "این مبلغ همین حالا به کیف پول شما اضافه شد."
          : incentive.trigger === "after_kyc"
            ? "پس از تأیید احراز هویت، جایزه به کیف پول شما اضافه می‌شود."
            : "پس از اولین معامله، جایزه به کیف پول شما اضافه می‌شود."}
      </p>
    </div>
  );
}
