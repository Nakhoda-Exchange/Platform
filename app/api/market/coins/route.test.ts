import { describe, expect, test } from "bun:test";
import { GET } from "./route";

describe("GET /api/market/coins", () => {
  test("returns the coin list as a JSON array", async () => {
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
});
