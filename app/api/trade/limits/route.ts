import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/trade/limits — the per-token order-size limits for EVERY symbol the
 * backend configures (GET /v1/trade/limits), as a JSON list. The auth cookie is
 * forwarded server-side by the HTTP interceptor. Each bound is IRT notional in
 * whole Toman, or null (unbounded → the global MIN_ORDER_IRT floor / balance
 * cap applies). The trade screen reads a single token's bounds from its trade
 * context; this endpoint exposes the full list for anything that needs it.
 */
export async function GET(): Promise<Response> {
  const result = await container
    .resolve(TOKENS.GetTradeLimitsUseCase)
    .execute();

  if (!result.ok) return respond(result);
  return Response.json({ limits: result.data });
}

export const dynamic = "force-dynamic";
