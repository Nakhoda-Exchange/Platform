"use client";

import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import { IrtWithdrawForm } from "@/components/wallet/irt-withdraw-form";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";
import WithdrawLoading from "./loading";

interface WithdrawVM {
  ibans: Iban[];
  cards: BankCard[];
  availableIrt: number;
  minWithdrawIrt: number;
  feeBps: number;
  feeCapIrt: number;
  otpRequired: boolean;
}

/**
 * Client-rendered Toman withdraw screen. Data is fetched in the browser from
 * `/api/wallet/withdraw` (server-side BFF).
 */
export function WithdrawClient() {
  const { data, error, loading, reload } = useClientData<WithdrawVM>(
    "/api/wallet/withdraw",
  );

  if (loading) return <WithdrawLoading />;
  if (error || !data) {
    return (
      <LoadError message="بارگذاری صفحه برداشت ناموفق بود." onRetry={reload} />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <IrtWithdrawForm
        initialIbans={data.ibans}
        cards={data.cards}
        availableIrt={data.availableIrt}
        minWithdrawIrt={data.minWithdrawIrt}
        feeBps={data.feeBps}
        feeCapIrt={data.feeCapIrt}
        otpRequired={data.otpRequired}
      />
    </div>
  );
}
