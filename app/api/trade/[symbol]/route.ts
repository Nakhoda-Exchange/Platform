import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/trade/[symbol] — the trade context (coin + live price + balances)
 * for the CSR trade screen, as JSON. A missing/untradeable coin is a 404 the
 * client renders as a load error with a back-to-market action.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
): Promise<Response> {
  const { symbol } = await params;
  const result = await container
    .resolve(TOKENS.GetTradeContextUseCase)
    .execute(symbol);

  if (!result.ok) return respond(result);
  if (!result.data) {
    return Response.json(
      { code: "NOT_FOUND", message: "این رمزارز برای معامله در دسترس نیست." },
      { status: 404 },
    );
  }

  return Response.json({ context: result.data });
}

export const dynamic = "force-dynamic";
