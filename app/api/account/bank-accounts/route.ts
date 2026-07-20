import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/account/bank-accounts — the bank-accounts view model for the CSR
 * bank-accounts screen, as JSON: whether the user is KYC-verified (gates
 * adding accounts) plus their saved cards and IBANs. The auth token is read
 * server-side by the HTTP interceptor.
 */
export async function GET(): Promise<Response> {
  const [profile, cards, ibans] = await Promise.all([
    container.resolve(TOKENS.GetProfileUseCase).execute(),
    container.resolve(TOKENS.ManageCardsUseCase).list(),
    container.resolve(TOKENS.ManageIbansUseCase).list(),
  ]);

  if (!profile.ok) return respond(profile);

  return Response.json({
    kycVerified: profile.data.kycVerified,
    cards: cards.ok ? cards.data : [],
    ibans: ibans.ok ? ibans.data : [],
  });
}

export const dynamic = "force-dynamic";
