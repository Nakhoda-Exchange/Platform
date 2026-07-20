"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  TRANSACTION_TYPES,
  type Transaction,
  type TransactionType,
} from "@/lib/core/domain/wallet/transaction";
import { TransactionFilters } from "@/components/wallet/transaction-filters";
import { TransactionTimeline } from "@/components/wallet/transaction-timeline";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import HistoryLoading from "./loading";

/**
 * Client-rendered wallet history. The active filter lives in the URL (`?type=`)
 * and is read client-side; data is fetched in the browser from
 * `/api/wallet/transactions` (server-side BFF). Switching a filter is a soft
 * navigation that changes the query, which re-runs the fetch.
 */
export function HistoryClient() {
  const typeParam = useSearchParams().get("type") ?? undefined;
  const filter = TRANSACTION_TYPES.includes(typeParam as TransactionType)
    ? (typeParam as TransactionType)
    : undefined;

  const { data, error, loading, reload } = useClientData<Transaction[]>(
    filter
      ? `/api/wallet/transactions?type=${encodeURIComponent(filter)}`
      : "/api/wallet/transactions",
  );

  if (loading) return <HistoryLoading />;
  if (error || !data) {
    return (
      <LoadError message="بارگذاری تاریخچه ناموفق بود." onRetry={reload} />
    );
  }

  // `at` crosses the BFF as an ISO string; revive it to a Date for the
  // timeline's day-grouping and Jalali formatting.
  const transactions = data.map((tx) => ({ ...tx, at: new Date(tx.at) }));

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
