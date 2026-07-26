import { afterEach, describe, expect, test } from "bun:test";
import { GET } from "./route";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** One row shaped per doc/market/api.md — enough to assert the contract. */
const COIN = {
  id: "bitcoin",
  name: "Bitcoin",
  symbol: "BTC",
  iconUrl: "/coins/btc.png",
  priceIrt: "72500000000",
  priceUsd: "104200.5",
  change24h: 3.2,
  marketCap: 2050,
  isNew: false,
};

// The composition root binds every port to its HTTP adapter over the shared
// HttpClient and passes no `fetchFn`, so the adapter reaches for global fetch at
// call time. Stubbing that is the only seam this route test has: without it the
// request goes to API_BASE_URL for real, and the test passes only when a
// Substructure backend happens to be listening there.
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/**
 * Swap global fetch for a stub. The double cast is deliberate: Next augments the
 * global `fetch` type with a `preconnect` property that a bare function lacks.
 */
function stubFetch(fn: () => Promise<Response>): void {
  globalThis.fetch = fn as unknown as typeof fetch;
}

describe("GET /api/market/coins", () => {
  test("returns the coin list as a JSON array", async () => {
    stubFetch(async () => jsonResponse([COIN]));

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    // Each row is a Coin per doc/market/api.md.
    const [coin] = body;
    expect(coin).toHaveProperty("id");
    expect(coin).toHaveProperty("symbol");
    expect(coin).toHaveProperty("priceIrt");
    expect(coin).toHaveProperty("change24h");
  });

  test("an unreachable backend becomes a NETWORK error, never a 200", async () => {
    stubFetch(async () => {
      throw new Error("ECONNREFUSED");
    });

    const res = await GET();
    // `NETWORK` matches no rule in statusForError, so it falls through to 400.
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("NETWORK");
  });
});
