import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { MarketList } from "@/components/market/market-list";

export const metadata: Metadata = {
  title: "بازار | ناخدا",
};

export default async function MarketPage() {
  const result = await container.resolve(TOKENS.ListCoinsUseCase).execute();

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-4">
      <h1 className="text-[17px] font-bold text-ink">بازار</h1>
      {result.ok ? (
        <MarketList coins={result.data} />
      ) : (
        <p className="py-12 text-center text-[15px] text-muted">
          بارگذاری بازار ناموفق بود. دوباره تلاش کنید.
        </p>
      )}
    </div>
  );
}
