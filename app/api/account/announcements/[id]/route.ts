import { container } from "@/lib/di/container.instance";
import { TOKENS } from "@/lib/di/tokens";
import { respond } from "@/lib/utils/api-response";
import { renderMarkdown } from "@/lib/utils/safe-markdown";

/**
 * GET /api/account/announcements/[id] — a single announcement for the CSR
 * detail screen, as JSON: the announcement plus its body rendered to HTML.
 * Bodies are first-party markdown, parsed server-side here (keeping `marked` out
 * of the client bundle) and SANITIZED — raw HTML dropped, URL schemes checked —
 * because the result is handed to `dangerouslySetInnerHTML` (issue #67). A missing id is a 404 the client renders
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

  const html = await renderMarkdown(result.data.body);
  return Response.json({ announcement: result.data, html });
}

export const dynamic = "force-dynamic";
