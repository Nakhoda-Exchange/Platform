import { describe, expect, test } from "bun:test";
import { GET } from "./route";

describe("GET /api/health", () => {
  test("reports the platform as healthy", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("platform");
    expect(typeof body.time).toBe("string");
    // A parseable ISO 8601 timestamp.
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });
});
