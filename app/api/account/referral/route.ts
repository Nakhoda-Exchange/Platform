import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/account/referral — the referral overview for the CSR referral
 * screen, as JSON. The auth token is read server-side by the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const result = await container
    .resolve(TOKENS.GetReferralOverviewUseCase)
    .execute();
  return respond(result);
}

export const dynamic = "force-dynamic";
