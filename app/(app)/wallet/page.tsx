import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "دارایی | ناخدا",
};

// ponytail: stub so the bottom nav isn't a dead link. Real wallet screen later.
export default function WalletPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center">
      <p className="text-[16px] text-slate-500">
        دارایی‌های شما به‌زودی این‌جا نمایش داده می‌شود.
      </p>
    </div>
  );
}
