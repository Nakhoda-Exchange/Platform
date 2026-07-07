import { formatIrt } from "@/lib/utils/money";

/**
 * Spendable Toman — the cash a user can buy or withdraw with, split out from
 * «دارایی کل» (which folds in coin value). This is the number people mean when
 * they ask "how much تومان do I have?", so on the wallet home it gets its own
 * always-visible line instead of hiding in the breakdown sheet.
 */
export function CashBalanceCard({
  availableIrt,
  pendingWithdrawIrt,
}: {
  availableIrt: number;
  pendingWithdrawIrt: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-card bg-surface px-4 py-3.5">
      <span className="text-[14px] font-medium text-muted">موجودی تومانی</span>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[17px] font-extrabold text-ink">
          {formatIrt(availableIrt)}
        </span>
        {pendingWithdrawIrt > 0 ? (
          <span className="text-[12px] text-placeholder">
            {formatIrt(pendingWithdrawIrt)} در حال برداشت
          </span>
        ) : null}
      </div>
    </div>
  );
}
