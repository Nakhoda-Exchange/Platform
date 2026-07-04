import Link from "next/link";
import {
  TRANSACTION_TYPES,
  type TransactionType,
} from "@/lib/core/domain/wallet/transaction";
import { cn } from "@/lib/utils/cn";

const TYPE_LABEL: Record<TransactionType, string> = {
  buy: "خرید",
  sell: "فروش",
  deposit: "واریز",
  withdraw: "برداشت",
};

/** Type filter chips — plain links (`?type=`), so the page stays a server component. */
export function TransactionFilters({ active }: { active?: TransactionType }) {
  const chip = (selected: boolean) =>
    cn(
      "flex h-10 shrink-0 items-center rounded-full px-4 text-[14px] font-bold transition-colors",
      selected ? "bg-brand text-white" : "bg-surface text-muted hover:text-ink",
    );
  return (
    <nav aria-label="فیلتر تراکنش‌ها" className="flex gap-2 overflow-x-auto">
      <Link href="/wallet/history" className={chip(!active)}>
        همه
      </Link>
      {TRANSACTION_TYPES.map((t) => (
        <Link
          key={t}
          href={`/wallet/history?type=${t}`}
          className={chip(active === t)}
        >
          {TYPE_LABEL[t]}
        </Link>
      ))}
    </nav>
  );
}
