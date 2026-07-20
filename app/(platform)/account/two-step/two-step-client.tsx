"use client";

import type { UserProfile } from "@/lib/core/domain/account/profile";
import { TwoStepForm } from "@/components/account/two-step-form";
import { LoadError } from "@/components/ui/load-error";
import { useClientData } from "@/lib/client/use-client-data";

/**
 * Client-rendered two-step (2FA) settings. The profile (which carries the 2FA
 * flag) is fetched in the browser from `/api/account/profile` — the same
 * server-side BFF the account hub uses.
 */
export function TwoStepClient() {
  const { data, error, loading, reload } = useClientData<UserProfile>(
    "/api/account/profile",
  );

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
        <div className="h-24 animate-pulse rounded-card bg-surface" />
        <div className="h-12 animate-pulse rounded-field bg-surface" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <LoadError message="بارگذاری تنظیمات ناموفق بود." onRetry={reload} />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <TwoStepForm enabled={data.twoFactorEnabled} />
    </div>
  );
}
