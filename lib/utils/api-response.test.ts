import { describe, expect, test } from "bun:test";
import { fail, ok } from "@/lib/core/domain/shared/result";
import { respond } from "./api-response";

describe("respond", () => {
  test("serializes a success Result as 200 with the raw payload", async () => {
    const res = respond(ok({ a: 1 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ a: 1 });
  });

  test("honors an explicit success status", () => {
    expect(respond(ok(null), 204).status).toBe(204);
  });

  test("returns the { code, message } contract on failure", async () => {
    const res = respond(fail("INSUFFICIENT_IRT", "موجودی کافی نیست."));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      code: "INSUFFICIENT_IRT",
      message: "موجودی کافی نیست.",
    });
  });

  test("maps error codes to their HTTP status", () => {
    expect(respond(fail("HTTP_404", "")).status).toBe(404);
    expect(respond(fail("COIN_NOT_FOUND", "")).status).toBe(404);
    expect(respond(fail("SESSION_UNAUTHORIZED", "")).status).toBe(401);
    expect(respond(fail("ADMIN_FORBIDDEN", "")).status).toBe(403);
    expect(respond(fail("NATIONAL_CODE_INVALID", "")).status).toBe(422);
  });
});
