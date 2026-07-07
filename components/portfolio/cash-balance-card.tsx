import { formatIrt } from "@/lib/utils/money";

/**
 * The composition of «دارایی کل»: the two buckets it's made of, so the total
 * reads as a sum rather than an unexplained number sitting next to the cash.
 * «موجودی تومانی» (spendable cash) comes first — it's the number people mean by
 * "how much تومان do I have?" — with the coin value beneath it, and any
 * in-review withdrawal noted last.
 */
export function CashBalanceCard({
  availableIrt,
  holdingsValueIrt,
  pendingWithdrawIrt,
}: {
  availableIrt: number;
  holdingsValueIrt: number;
  pendingWithdrawIrt: number;
}) {
  return (
    <dl className="flex flex-col divide-y divide-line rounded-card bg-surface">
      <div className="flex items-center justify-between px-4 py-3">
        <dt className="flex flex-col">
          <span className="text-[14px] font-medium text-ink">
            موجودی تومانی
          </span>
          <span className="text-[12px] text-placeholder">
            قابل خرید و برداشت
          </span>
        </dt>
        <dd className="text-[15px] font-extrabold text-ink">
          {formatIrt(availableIrt)}
        </dd>
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <dt className="text-[14px] font-medium text-ink">ارزش رمزارزها</dt>
        <dd className="text-[15px] font-extrabold text-ink">
          {formatIrt(holdingsValueIrt)}
        </dd>
      </div>
      {pendingWithdrawIrt > 0 ? (
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-[14px] text-muted">در حال برداشت</dt>
          <dd className="text-[15px] font-bold text-placeholder">
            {formatIrt(pendingWithdrawIrt)}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
