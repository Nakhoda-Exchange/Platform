import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بازار | ناخدا",
};

/**
 * ponytail: placeholder market — the destination for approved users. The full
 * market screen is designed in Figma (nakhoda-market) and is separate work.
 */
export default function MarketPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-white px-6 text-center">
      <p className="text-[16px] text-slate-500">
        بازار به‌زودی در دسترس قرار می‌گیرد.
      </p>
    </main>
  );
}
