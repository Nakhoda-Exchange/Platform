import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/orders — the user's open (resting) orders for the CSR open-orders
 * screen, as JSON. The auth cookie is forwarded server-side by the HTTP
 * interceptor. Proxies GET /v1/orders?status=open.
 */
export async function GET(): Promise<Response> {
  const result = await container
    .resolve(TOKENS.ListOpenOrdersUseCase)
    .execute();

  if (!result.ok) return respond(result);
  return Response.json({ orders: result.data });
}

export const dynamic = "force-dynamic";
