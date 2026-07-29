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
      // The CODE is the contract; the wording is ours, so a known code renders
      // this app's pinned copy rather than whatever the backend phrased.
      expect(result.error.message).toBe("موجودی تومانی شما کافی نیست.");
    }
  });

  test("an ENGLISH backend message never reaches the caller", async () => {
    // The trade engine did exactly this: it published its own domain string,
    // which the app rendered verbatim in a toast.
    const client = clientWith(async () =>
      jsonResponse(
        {
          code: "SOME_UNMAPPED_CODE",
          message: "order size 300000 IRT is below the minimum 500000 IRT",
        },
        422,
      ),
    );
    const result = await client.post("/orders", {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SOME_UNMAPPED_CODE");
      expect(/[A-Za-z]/.test(result.error.message)).toBe(false);
    }
  });

  test("a Persian message on an unmapped code is kept — figures survive", async () => {
    const message = "کمینه مبلغ این سفارش ۵۰۰٬۰۰۰ تومان است.";
    const client = clientWith(async () =>
      jsonResponse({ code: "BRAND_NEW_LIMIT_CODE", message }, 422),
    );
    const result = await client.post("/orders", {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe(message);
  });

  test("a per-request timeout overrides the client default", async () => {
    // A synchronous MARKET settle outlives a read-sized timeout, and aborting
    // it does not cancel the order — it only makes us report a false failure
    // for a trade that went on to execute.
    const slowFetch = (input: string | URL, init?: RequestInit) =>
      new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => resolve(jsonResponse({ ok: true })), 40);
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        });
      });

    const client = clientWith(slowFetch, { timeoutMs: 5 });
    // Default budget: too short, so the response is lost to an abort.
    const aborted = await client.post("/orders", {});
    expect(aborted.ok).toBe(false);
    if (!aborted.ok) expect(aborted.error.code).toBe("NETWORK");
    // Same call with the submit's own budget: it survives.
    const survived = await client.request({
      method: "POST",
      path: "/orders",
      timeoutMs: 5_000,
    });
    expect(survived.ok).toBe(true);
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
