import {
  TRANSACTION_TYPES,
  type TransactionType,
} from "@/lib/core/domain/wallet/transaction";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/wallet/transactions[?type=…] — the wallet history for the CSR
 * history screen, as JSON. An optional `type` query filters by transaction
 * kind (unknown values are ignored, matching the former server page). The auth
 * token is read server-side by the HTTP interceptor.
 */
export async function GET(request: Request): Promise<Response> {
  const type = new URL(request.url).searchParams.get("type") ?? undefined;
  const filter = TRANSACTION_TYPES.includes(type as TransactionType)
    ? (type as TransactionType)
    : undefined;

  const result = await container
    .resolve(TOKENS.ListTransactionsUseCase)
    .execute(filter);

  return respond(result);
}

export const dynamic = "force-dynamic";
