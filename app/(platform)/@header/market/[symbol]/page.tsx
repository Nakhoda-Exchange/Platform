import Link from "next/link";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { CoinPageHeader } from "@/components/market/coin-page-header";
import { HeaderBar } from "@/components/layout/header-bar";
import { ChevronRightIcon } from "@/components/ui/icons";

/** The coin detail page's slot header: coin identity + favorite/history. */
export default async function CoinHeaderSlot({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const result = await container
    .resolve(TOKENS.GetCoinDetailUseCase)
    .execute(symbol);

  // Unknown coin or a failed fetch: a plain back bar — the page itself
  // renders the 404/error state.
  if (!result.ok || !result.data) {
    return (
      <HeaderBar
        start={
          <>
            <Link
              href="/market"
              aria-label="بازگشت"
              className="flex size-11 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface"
            >
              <ChevronRightIcon size={24} />
            </Link>
            <h1 className="text-[18px] font-extrabold text-ink">
              جزئیات رمزارز
            </h1>
          </>
        }
        end={null}
      />
    );
  }

  return <CoinPageHeader coin={result.data.coin} />;
}
