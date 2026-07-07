import { describe, expect, test } from "bun:test";
import { HttpClient } from "./http-client";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function clientWith(
  fetchFn: (input: string | URL, init?: RequestInit) => Promise<Response>,
  extra: Partial<ConstructorParameters<typeof HttpClient>[0]> = {},
) {
  return new HttpClient({ baseUrl: "https://api.test", fetchFn, ...extra });
}

describe("HttpClient", () => {
  test("GET returns ok(data) and hits baseUrl + path", async () => {
    let url = "";
    const client = clientWith(async (input) => {
      url = String(input);
      return jsonResponse({ hello: "دنیا" });
    });
    const result = await client.get<{ hello: string }>("/x");
    expect(url).toBe("https://api.test/x");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.hello).toBe("دنیا");
  });

  test("backend {code,message} error bodies become the DomainError", async () => {
    const client = clientWith(async () =>
      jsonResponse(
        { code: "INSUFFICIENT_IRT", message: "موجودی کافی نیست." },
        422,
      ),
    );
    const result = await client.post("/orders", {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INSUFFICIENT_IRT");
      expect(result.error.message).toBe("موجودی کافی نیست.");
    }
  });

  test("bodyless errors fall back to a Persian status message", async () => {
    const client = clientWith(
      async () => new Response("boom", { status: 503 }),
    );
    const result = await client.get("/x");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("HTTP_503");
      expect(result.error.message).toContain("دسترس");
    }
  });

  test("network failures normalize to NETWORK", async () => {
    const client = clientWith(async () => {
      throw new Error("offline");
    });
    const result = await client.get("/x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NETWORK");
  });

  test("request interceptors mutate headers; POST serializes the body", async () => {
    let headers: Record<string, string> = {};
    let body = "";
    const client = clientWith(
      async (_input, init) => {
        headers = init?.headers as Record<string, string>;
        body = String(init?.body);
        return jsonResponse({});
      },
      {
        requestInterceptors: [
          (req) => {
            req.headers.Authorization = "Bearer token-1";
          },
        ],
      },
    );
    await client.post("/x", { a: 1 });
    expect(headers.Authorization).toBe("Bearer token-1");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(body).toBe('{"a":1}');
  });

  test("204 resolves ok(undefined)", async () => {
    const client = clientWith(async () => new Response(null, { status: 204 }));
    const result = await client.post("/x");
    expect(result.ok).toBe(true);
  });
});
