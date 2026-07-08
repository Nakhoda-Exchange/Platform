import Link from "next/link";
import { formatIrtShort } from "@/lib/utils/money";

/**
 * The Toman balance shown as the FIRST «دارایی» row — cash sits alongside the
 * coins like on an exchange (صراف), so «چقدر دارم؟» always starts with the money
 * you can spend. Taps through to deposit to top it up. Mirrors HoldingListItem's
 * layout (identity right, balance left) so the list reads as one column.
 */
export function CashListItem({ availableIrt }: { availableIrt: number }) {
  return (
    <Link
      href="/wallet/deposit"
      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface"
    >
      {/* Identity */}
      <div className="flex items-center gap-3">
        <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-brand text-[18px] font-extrabold text-white">
          ت
        </span>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">تومان</span>
          <span className="text-[12px] text-muted">موجودی</span>
        </div>
      </div>

      {/* Balance */}
      <div className="flex flex-col items-start gap-0.5" dir="ltr">
        <span className="text-[14px] font-bold text-ink">
          {formatIrtShort(availableIrt)}
        </span>
      </div>
    </Link>
  );
}
