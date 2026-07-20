"use client";

import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import { IrtDepositForm } from "@/components/wallet/irt-deposit-form";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import { formatIrt } from "@/lib/utils/money";
import DepositLoading from "./loading";

interface DepositVM {
  availableIrt: number;
  cards: BankCard[];
}

/**
 * Client-rendered Toman deposit screen. Data is fetched in the browser from
 * `/api/wallet/deposit` (server-side BFF). A zero balance means this is a
 * first/fresh deposit — the form greets the user instead of dropping them into
 * a bare form.
 */
export function DepositClient() {
  const { data, error, loading, reload } = useClientData<DepositVM>(
    "/api/wallet/deposit",
  );

  if (loading) return <DepositLoading />;
  if (error || !data) {
    return (
      <LoadError message="بارگذاری صفحه واریز ناموفق بود." onRetry={reload} />
    );
  }

  const { availableIrt, cards } = data;
  const firstDeposit = availableIrt <= 0;

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      {availableIrt > 0 ? (
        // Current spendable balance, so the user sees what they're adding to.
        <div className="flex items-center justify-between rounded-card bg-surface px-4 py-3.5">
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-[16px] font-extrabold text-white"
            >
              ت
            </span>
            <span className="text-[14px] text-muted">موجودی فعلی</span>
          </span>
          <span dir="ltr" className="text-[15px] font-extrabold text-ink">
            {formatIrt(availableIrt)}
          </span>
        </div>
      ) : null}

      <IrtDepositForm initialCards={cards} firstDeposit={firstDeposit} />
    </div>
  );
}
