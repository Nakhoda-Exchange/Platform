import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";
import type { TradePreferences } from "@/lib/core/domain/trade/preferences";

/** GET — the caller's trade preferences (defaults when never saved). */
export async function GET(): Promise<Response> {
  const result = await container
    .resolve(TOKENS.GetTradePreferencesUseCase)
    .execute();
  if (!result.ok) return respond(result);
  return Response.json({ preferences: result.data });
}

/**
 * PUT — save them. Returns what the backend STORED rather than what was sent:
 * these values change how the caller's own orders execute, so the client should
 * never assume the write landed as intended.
 */
export async function PUT(request: Request): Promise<Response> {
  const body = (await request
    .json()
    .catch(() => ({}))) as Partial<TradePreferences>;
  const result = await container
    .resolve(TOKENS.SaveTradePreferencesUseCase)
    .execute({
      slippageBps:
        typeof body.slippageBps === "number" &&
        Number.isFinite(body.slippageBps)
          ? Math.round(body.slippageBps)
          : null,
      confirmSeconds:
        typeof body.confirmSeconds === "number" &&
        Number.isFinite(body.confirmSeconds)
          ? Math.round(body.confirmSeconds)
          : 30,
    });
  if (!result.ok) return respond(result);
  return Response.json({ preferences: result.data });
}

export const dynamic = "force-dynamic";
