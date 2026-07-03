import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بازار | ناخدا",
};

/**
 * ponytail: placeholder market content inside the platform shell. The full
 * market screen (search, trending, list) is separate work.
 */
export default function MarketPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center">
      <p className="text-[16px] text-slate-500">
        بازار به‌زودی در دسترس قرار می‌گیرد.
      </p>
    </div>
  );
}
