import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/account/announcements — the announcements list (newest first) for
 * the CSR announcements screen, as JSON. The auth token is read server-side by
 * the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const result = await container
    .resolve(TOKENS.ListAnnouncementsUseCase)
    .execute();
  return respond(result);
}

export const dynamic = "force-dynamic";
