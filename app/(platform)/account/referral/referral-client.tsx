"use client";

import type { ReferralOverview } from "@/lib/core/domain/referral/referral";
import { ReferralScreen } from "@/components/referral/referral-screen";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";

/**
 * Client-rendered referral screen. Data is fetched in the browser from
 * `/api/account/referral` (server-side BFF).
 */
export function ReferralClient() {
  const { data, error, loading, reload } = useClientData<ReferralOverview>(
    "/api/account/referral",
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
        <div className="h-40 animate-pulse rounded-card bg-surface" />
        <div className="h-24 animate-pulse rounded-card bg-surface" />
        <div className="h-24 animate-pulse rounded-card bg-surface" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <LoadError message="بارگذاری کد دعوت ناموفق بود." onRetry={reload} />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <ReferralScreen overview={data} />
    </div>
  );
}
