import { marked } from "marked";
import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";

/**
 * GET /api/account/announcements/[id] — a single announcement for the CSR
 * detail screen, as JSON: the announcement plus its body rendered to HTML.
 * Bodies are first-party markdown, so they're parsed server-side here (keeping
 * `marked` out of the client bundle). A missing id is a 404 the client renders
 * as a load error. The auth token is read server-side by the HTTP interceptor.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const result = await container
    .resolve(TOKENS.ListAnnouncementsUseCase)
    .byId(id);

  if (!result.ok) return respond(result);
  if (!result.data) {
    return Response.json(
      { code: "NOT_FOUND", message: "این اعلان پیدا نشد." },
      { status: 404 },
    );
  }

  const html = await marked.parse(result.data.body);
  return Response.json({ announcement: result.data, html });
}

export const dynamic = "force-dynamic";
