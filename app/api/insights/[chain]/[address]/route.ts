import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import type { Chain } from "@/lib/core/domain/shared/token-identity";

/**
 * Token insights for one on-chain token — for CLIENT-driven refresh / window
 * switches (the PDP's first paint renders via RSC calling the same use case).
 * All provider calls (and their keys) stay server-side here; the same
 * `TokenInsightsPort` + per-capability cache back both paths — no forked logic.
 *
 * GET /api/insights/{chain}/{address}?usdToIrt={rate}
 *   usdToIrt (optional) labels the Toman price-impact sizes; omit for a
 *   USD-only impact curve.
 */

const CHAINS: readonly Chain[] = ["solana", "ethereum", "bsc", "base"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chain: string; address: string }> },
): Promise<Response> {
  const { chain, address } = await params;

  if (!CHAINS.includes(chain as Chain)) {
    return Response.json({ error: "UNKNOWN_CHAIN" }, { status: 400 });
  }
  if (!address) {
    return Response.json({ error: "MISSING_ADDRESS" }, { status: 400 });
  }

  const raw = new URL(request.url).searchParams.get("usdToIrt");
  const parsed = raw != null ? Number(raw) : 0;
  const usdToIrt = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

  const result = await container
    .resolve(TOKENS.TokenInsightsPort)
    .getInsights({ chain: chain as Chain, address }, usdToIrt);

  if (!result.ok) {
    return Response.json({ error: result.error.code }, { status: 502 });
  }

  // Short edge cache; the service's per-capability TTLs are the real freshness
  // control, this just coalesces bursts.
  return Response.json(result.data, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=60",
    },
  });
}
