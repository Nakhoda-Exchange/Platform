import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { MarketScreen } from "@/components/market/market-screen";

export const metadata: Metadata = {
  title: "بازار | ناخدا",
};

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const [{ q, f }, result] = await Promise.all([
    searchParams,
    container.resolve(TOKENS.GetMarketOverviewUseCase).execute(),
  ]);

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری بازار ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  return (
    <MarketScreen
      overview={result.data}
      initialQuery={q ?? ""}
      initialFilter={f}
    />
  );
}
