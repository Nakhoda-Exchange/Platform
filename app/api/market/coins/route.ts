import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/market/coins — the public tradable coin list (PLP), as JSON.
 *
 * A thin presentation layer over `ListCoinsUseCase`: it resolves the use case
 * from the DI container and serializes the domain `Result` per the shared API
 * conventions. The payload shape mirrors `doc/market/api.md` (an array of Coin),
 * so this route is contract-compatible with the backend it will later proxy.
 */
export async function GET(): Promise<Response> {
  const result = await container.resolve(TOKENS.ListCoinsUseCase).execute();
  return respond(result);
}

// Prices move; the coin list is never statically cached.
export const dynamic = "force-dynamic";
