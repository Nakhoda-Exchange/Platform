import type { Metadata } from "next";
import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import {
  TRANSACTION_TYPES,
  type TransactionType,
} from "@/lib/core/domain/wallet/transaction";
import { TransactionFilters } from "@/components/wallet/transaction-filters";
import { TransactionTimeline } from "@/components/wallet/transaction-timeline";

export const metadata: Metadata = {
  title: "تاریخچه تراکنش‌ها | ناخدا",
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filter = TRANSACTION_TYPES.includes(type as TransactionType)
    ? (type as TransactionType)
    : undefined;

  const result = await container
    .resolve(TOKENS.ListTransactionsUseCase)
    .execute(filter);

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری تاریخچه ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  const transactions = result.data;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
      <TransactionFilters active={filter} />
      {transactions.length > 0 ? (
        <TransactionTimeline transactions={transactions} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-[16px] text-muted">
            {filter ? "تراکنشی از این نوع ندارید." : "هنوز تراکنشی ندارید."}
          </p>
          {filter ? (
            <Link
              href="/wallet/history"
              className="text-[15px] font-bold text-brand"
            >
              نمایش همه تراکنش‌ها
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
