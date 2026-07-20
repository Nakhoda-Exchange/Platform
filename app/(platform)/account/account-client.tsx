"use client";

import type { UserProfile } from "@/lib/core/domain/account/profile";
import { ProfileHeader } from "@/components/account/profile-header";
import { AccountMenu } from "@/components/account/account-menu";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/load-error";
import { logout } from "@/app/actions/account";
import { toPersianDigits } from "@/lib/utils/digits";
import { useClientData } from "@/lib/client/use-client-data";
import pkg from "@/package.json";
import AccountLoading from "./loading";

/**
 * Client-rendered account hub. The profile is fetched in the browser from
 * `/api/account/profile` (server-side BFF); logout still runs through the
 * `logout` server action.
 */
export function AccountClient() {
  const { data, error, loading, reload } = useClientData<UserProfile>(
    "/api/account/profile",
  );

  if (loading) return <AccountLoading />;
  if (error || !data) {
    return (
      <LoadError
        message="بارگذاری حساب کاربری ناموفق بود. دوباره تلاش کنید."
        onRetry={reload}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <ProfileHeader profile={data} />
      <AccountMenu profile={data} />

      <div className="mt-auto flex flex-col items-center gap-3">
        <form action={logout} className="w-full">
          <Button
            type="submit"
            variant="ghost"
            size="lg"
            fullWidth
            className="bg-loss-soft font-bold text-loss hover:bg-loss-soft"
          >
            خروج از حساب
          </Button>
        </form>
        <span className="text-[12px] text-placeholder">
          نسخه {toPersianDigits(pkg.version)}
        </span>
      </div>
    </div>
  );
}
