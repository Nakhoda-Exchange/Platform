import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/account/profile — the current user's profile, as JSON, for the CSR
 * account hub. The auth token is read server-side by the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const result = await container.resolve(TOKENS.GetProfileUseCase).execute();
  return respond(result);
}

export const dynamic = "force-dynamic";
