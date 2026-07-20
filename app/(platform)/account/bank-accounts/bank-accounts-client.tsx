"use client";

import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import { BankAccountsManager } from "@/components/account/bank-accounts-manager";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";

interface BankAccountsVM {
  kycVerified: boolean;
  cards: BankCard[];
  ibans: Iban[];
}

/**
 * Client-rendered bank-accounts manager. Data is fetched in the browser from
 * `/api/account/bank-accounts` (server-side BFF).
 */
export function BankAccountsClient() {
  const { data, error, loading, reload } = useClientData<BankAccountsVM>(
    "/api/account/bank-accounts",
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
        <div className="h-24 animate-pulse rounded-card bg-surface" />
        <div className="h-24 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <LoadError
        message="بارگذاری حساب‌های بانکی ناموفق بود. دوباره تلاش کنید."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <BankAccountsManager
        kycVerified={data.kycVerified}
        initialCards={data.cards}
        initialIbans={data.ibans}
      />
    </div>
  );
}
