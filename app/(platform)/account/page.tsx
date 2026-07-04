import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { ProfileHeader } from "@/components/account/profile-header";
import { AccountMenu } from "@/components/account/account-menu";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/account";
import { toPersianDigits } from "@/lib/utils/digits";
import pkg from "@/package.json";

export const metadata: Metadata = {
  title: "حساب کاربری | ناخدا",
};

export default async function AccountPage() {
  const result = await container.resolve(TOKENS.GetProfileUseCase).execute();

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری حساب کاربری ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      <ProfileHeader profile={result.data} />
      <AccountMenu profile={result.data} />

      <div className="mt-auto flex flex-col items-center gap-3">
        <form action={logout} className="w-full">
          <Button
            type="submit"
            variant="ghost"
            size="lg"
            fullWidth
            className="bg-surface text-red-600"
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
