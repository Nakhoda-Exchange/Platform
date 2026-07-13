/**
 * GET /api/health — liveness probe for the platform web app.
 *
 * Public, dependency-free, and cheap: the Nakhoda monorepo's orchestration
 * (docker-compose / scripts) polls this to gate readiness before wiring the
 * Substructure backend in. Returns 200 as soon as the Next.js server can serve.
 */
export async function GET(): Promise<Response> {
  return Response.json({
    status: "ok",
    service: "platform",
    time: new Date().toISOString(),
  });
}

// Liveness must reflect the running server, never a build-time cached value.
export const dynamic = "force-dynamic";
