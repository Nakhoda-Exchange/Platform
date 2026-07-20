import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/market/[symbol] — the coin-detail (PDP) view model for the CSR
 * detail screen, as JSON: the coin detail plus the viewer's position in it (if
 * any), which drives the holding card and «فروش» action. A missing coin is a
 * 404 the client renders as a load error with a back-to-market action.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
): Promise<Response> {
  const { symbol } = await params;
  const [result, portfolioResult] = await Promise.all([
    container.resolve(TOKENS.GetCoinDetailUseCase).execute(symbol),
    container.resolve(TOKENS.GetPortfolioUseCase).execute(),
  ]);

  if (!result.ok) return respond(result);
  if (!result.data) {
    return Response.json(
      { code: "NOT_FOUND", message: "این رمزارز پیدا نشد." },
      { status: 404 },
    );
  }

  const detail = result.data;
  const held = portfolioResult.ok
    ? portfolioResult.data.holdings.find(
        (h) => h.coin.id === detail.coin.id && h.amount > 0,
      )
    : undefined;
  const holding = held
    ? { amount: held.amount, valueIrt: held.valueIrt, costIrt: held.costIrt }
    : null;

  return Response.json({ detail, holding });
}

export const dynamic = "force-dynamic";
