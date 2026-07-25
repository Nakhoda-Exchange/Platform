import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/trade/quote?symbol=SOL&side=buy&amountIrt=1000000 — the pre-commit
 * quote for the order the user is composing, used by the trade screen to show
 * the expected slippage before they commit.
 *
 * A GET (not a POST) even though the backend call is a POST: this is a pure
 * read with no side effects, and the query-string form lets the screen treat it
 * as plain cacheable data keyed by the amount. The auth cookie is forwarded
 * server-side by the HTTP interceptor.
 */
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const symbol = params.get("symbol") ?? "";
  const side = params.get("side") === "sell" ? "sell" : "buy";
  const amountIrt = Number(params.get("amountIrt") ?? "0");

  if (!symbol) {
    return Response.json(
      { code: "BAD_REQUEST", message: "نماد رمزارز مشخص نیست." },
      { status: 400 },
    );
  }

  const result = await container
    .resolve(TOKENS.GetTradeQuoteUseCase)
    .execute(symbol, side, amountIrt);

  if (!result.ok) return respond(result);
  return Response.json({ quote: result.data });
}

export const dynamic = "force-dynamic";
