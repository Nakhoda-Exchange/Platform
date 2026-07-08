import Link from "next/link";
import { formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * The Toman balance card, shared by the wallet «دارایی‌های من» list and the
 * market strip so the two never diverge: cash sits alongside the coins like on
 * an exchange (صراف). Taps through to deposit to top it up. `className` supplies
 * the container look per context (wallet = a plain list row, market = a card);
 * the identity + balance inside stay identical.
 */
export function CashListItem({
  availableIrt,
  className,
}: {
  availableIrt: number;
  className?: string;
}) {
  return (
    <Link
      href="/wallet/deposit"
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
        className ?? "hover:bg-surface",
      )}
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
