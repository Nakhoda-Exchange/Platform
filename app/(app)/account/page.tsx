import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "حساب کاربری | ناخدا",
};

// ponytail: stub so the bottom nav isn't a dead link. Real account screen later.
export default function AccountPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center">
      <p className="text-[16px] text-slate-500">
        حساب کاربری شما به‌زودی این‌جا در دسترس خواهد بود.
      </p>
    </div>
  );
}
