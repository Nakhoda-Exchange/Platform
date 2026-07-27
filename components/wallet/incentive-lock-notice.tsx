"use client";

import { useActionState, useState } from "react";
import { forfeitIncentiveLock } from "@/app/actions/incentives";
import { initialForfeitFormState } from "@/app/actions/incentives-state";
import { LockIcon } from "@/components/ui/icons";
import {
  daysUntil,
  LOCK_CONDITION_LABELS,
  progressRatio,
  type IncentiveLock,
} from "@/lib/core/domain/incentives/incentive-lock";
import { formatIrt } from "@/lib/utils/money";
import { toPersianDigits } from "@/lib/utils/digits";

/**
 * Explains why some of the user's Toman cannot leave yet.
 *
 * Shown on the withdraw screen rather than buried in an account page, because
 * this is the exact moment the shortfall bites — a «موجودی کافی نیست» error on a
 * balance the user can plainly see would otherwise look like a bug.
 *
 * Two things it is careful to say:
 *   * the gift is still fully TRADEABLE — only cashing out is held;
 *   * release is all-or-nothing, so a progress bar at 95% has freed nothing.
 * Showing progress without the second point would be a lie of omission.
 */
export function IncentiveLockNotice({
  lockedIrt,
  locks,
}: {
  lockedIrt: string;
  locks: IncentiveLock[];
}) {
  if (locks.length === 0 || Number(lockedIrt) <= 0) return null;

  return (
    <section
      aria-label="هدیه‌های قفل‌شده"
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-brand">
          <LockIcon size={18} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-bold text-ink">
            {formatIrt(Number(lockedIrt))} از موجودی شما هنوز قابل برداشت نیست
          </p>
          <p className="text-[13px] leading-6 text-muted">
            این مبلغ هدیه است و می‌توانید همین حالا با آن معامله کنید؛ فقط
            برداشت آن تا کامل‌شدن شرایط زیر ممکن نیست.
          </p>
        </div>
      </div>

      {locks.map((lock) => (
        <LockCard key={lock.id} lock={lock} />
      ))}
    </section>
  );
}

function LockCard({ lock }: { lock: IncentiveLock }) {
  const remainingDays = daysUntil(lock.unlockAt);
  const forfeitDays = daysUntil(lock.forfeitAt);

  return (
    <div className="flex flex-col gap-3 rounded-card bg-paper p-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted">هدیه قفل‌شده</span>
        <span dir="ltr" className="text-[14px] font-bold text-ink">
          {formatIrt(Number(lock.amountIrt))}
        </span>
      </div>

      {/* The cliff warning, stated before the bars so it frames them. */}
      <p className="text-[12px] leading-6 text-muted">
        تا زمانی که <strong className="text-ink">همهٔ</strong> شرط‌های زیر
        برآورده نشود، هیچ بخشی از این مبلغ آزاد نمی‌شود.
      </p>

      <ul className="flex flex-col gap-2.5">
        {lock.unlockAt !== null && remainingDays !== null ? (
          <ConditionRow
            label={LOCK_CONDITION_LABELS.time}
            done={!lock.unmet.includes("time")}
            detail={
              remainingDays > 0
                ? `${toPersianDigits(String(remainingDays))} روز مانده`
                : "تکمیل شد"
            }
          />
        ) : null}

        {lock.requiredVolumeIrt !== null ? (
          <ConditionRow
            label={LOCK_CONDITION_LABELS.volume}
            done={!lock.unmet.includes("volume")}
            detail={`${formatIrt(Number(lock.volumeIrt))} از ${formatIrt(Number(lock.requiredVolumeIrt))}`}
            ratio={progressRatio(lock.volumeIrt, lock.requiredVolumeIrt)}
          />
        ) : null}

        {lock.requiredDepositIrt !== null ? (
          <ConditionRow
            label={LOCK_CONDITION_LABELS.deposit}
            done={!lock.unmet.includes("deposit")}
            detail={`${formatIrt(Number(lock.depositIrt))} از ${formatIrt(Number(lock.requiredDepositIrt))}`}
            ratio={progressRatio(lock.depositIrt, lock.requiredDepositIrt)}
          />
        ) : null}
      </ul>

      {forfeitDays !== null ? (
        <p className="text-[12px] leading-6 text-muted">
          اگر تا {toPersianDigits(String(forfeitDays))} روز دیگر شرایط کامل
          نشود، این هدیه باطل می‌شود.
        </p>
      ) : null}

      {lock.canForfeit ? <ForfeitControl lock={lock} /> : null}
    </div>
  );
}

/** One condition: what it is, whether it is done, and how far along if not. */
function ConditionRow({
  label,
  done,
  detail,
  ratio,
}: {
  label: string;
  done: boolean;
  detail: string;
  ratio?: number | null;
}) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-ink">
          {done ? "✓ " : ""}
          {label}
        </span>
        <span dir="ltr" className="text-[12px] text-muted">
          {detail}
        </span>
      </div>
      {ratio !== null && ratio !== undefined ? (
        <div
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(ratio * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-line"
        >
          <div
            className={done ? "h-full bg-gain" : "h-full bg-brand"}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      ) : null}
    </li>
  );
}

/**
 * Abandoning the gift. Two-step on purpose: this destroys money, and a
 * single mistap on a screen the user came to for an unrelated reason would be
 * unrecoverable.
 *
 * The confirmation states plainly that it frees nothing today — the honest
 * framing, and the one that stops a user from tapping it expecting their
 * balance to become withdrawable.
 */
function ForfeitControl({ lock }: { lock: IncentiveLock }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(
    forfeitIncentiveLock,
    initialForfeitFormState,
  );

  if (state.forfeited) {
    return (
      <p className="text-[12px] leading-6 text-gain">
        {state.forfeited.outcome === "released"
          ? "شرایط این هدیه کامل شده بود و چیزی کسر نشد — مبلغ آزاد شد."
          : "از این هدیه صرف‌نظر کردید و محدودیت برداشت برداشته شد."}
      </p>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start text-[12px] font-bold text-muted underline underline-offset-4 transition-colors hover:text-ink"
      >
        صرف‌نظر از هدیه و برداشتن قفل
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lockId" value={lock.id} />
      <p className="text-[12px] leading-6 text-loss">
        با صرف‌نظر، باقی‌ماندهٔ هدیه از حساب شما کسر می‌شود و دیگر قابل بازگشت
        نیست. این کار مبلغ قابل برداشت شما را همین حالا بیشتر نمی‌کند؛ فقط
        محدودیت را برای همیشه برمی‌دارد تا واریزی‌های بعدی‌تان آزاد باشد.
      </p>
      {state.error ? (
        <p className="text-[12px] text-loss">{state.error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-field border border-loss/40 bg-loss/10 px-3 py-1.5 text-[12px] font-bold text-loss transition-colors hover:bg-loss/20 disabled:opacity-60"
        >
          {pending ? "در حال انجام…" : "بله، صرف‌نظر می‌کنم"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-field border border-line px-3 py-1.5 text-[12px] text-ink transition-colors hover:bg-surface"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
