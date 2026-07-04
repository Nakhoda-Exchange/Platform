import type { Metadata } from "next";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { PortfolioSummary } from "@/components/portfolio/portfolio-summary";
import { HoldingListItem } from "@/components/portfolio/holding-list-item";
import { PortfolioEmpty } from "@/components/portfolio/portfolio-empty";

export const metadata: Metadata = {
  title: "دارایی | ناخدا",
};

export default async function WalletPage() {
  const result = await container.resolve(TOKENS.GetPortfolioUseCase).execute();

  if (!result.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center">
        <p className="text-[15px] text-muted">
          بارگذاری دارایی‌ها ناموفق بود. دوباره تلاش کنید.
        </p>
      </div>
    );
  }

  const portfolio = result.data;
  if (portfolio.holdings.length === 0) {
    return <PortfolioEmpty />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-6 pt-4">
      <PortfolioSummary portfolio={portfolio} />
      <section className="flex flex-col gap-2">
        <h2 className="text-[17px] font-bold text-ink">دارایی‌های من</h2>
        <ul className="flex flex-col divide-y divide-line">
          {portfolio.holdings.map((holding) => (
            <li key={holding.coin.id}>
              <HoldingListItem holding={holding} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
