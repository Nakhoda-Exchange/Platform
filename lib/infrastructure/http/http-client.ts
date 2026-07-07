import { fail, ok, type Result } from "@/lib/core/domain/shared/result";

/**
 * The single HTTP transport every HTTP adapter goes through (backend
 * integration readiness). One place owns base URL, headers, interceptors,
 * timeouts, and error normalization — adapters only name endpoints and map
 * DTOs to domain types.
 *
 * API contracts for the backend team live in doc/<feature>/api.md.
 */

export interface HttpRequest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string; // e.g. "/market/coins"
  body?: unknown;
  headers: Record<string, string>;
}

export interface HttpErrorBody {
  code?: string;
  message?: string;
}

/** Mutate/extend the outgoing request (auth, locale, tracing…). */
export type RequestInterceptor = (request: HttpRequest) => Promise<void> | void;

/** Observe the raw response before normalization (logging, retries-later). */
export type ResponseInterceptor = (
  response: Response,
  request: HttpRequest,
) => Promise<void> | void;

const DEFAULT_TIMEOUT_MS = 15_000;

/** Persian fallbacks when the backend body carries no message. */
function messageForStatus(status: number): string {
  if (status === 401) return "نشست شما منقضی شده است. دوباره وارد شوید.";
  if (status === 403) return "اجازه این کار را ندارید.";
  if (status === 404) return "موردی پیدا نشد.";
  if (status === 422 || status === 400) return "اطلاعات ارسال‌شده درست نیست.";
  if (status >= 500) return "سامانه در دسترس نیست. کمی بعد دوباره تلاش کنید.";
  return "خطایی رخ داد. دوباره تلاش کنید.";
}

export class HttpClient {
  constructor(
    private readonly options: {
      baseUrl: string;
      requestInterceptors?: RequestInterceptor[];
      responseInterceptors?: ResponseInterceptor[];
      timeoutMs?: number;
      /** Injected for tests; defaults to global fetch. */
      fetchFn?: (input: string | URL, init?: RequestInit) => Promise<Response>;
    },
  ) {}

  get<T>(path: string): Promise<Result<T>> {
    return this.request<T>({ method: "GET", path, headers: {} });
  }

  post<T>(path: string, body?: unknown): Promise<Result<T>> {
    return this.request<T>({ method: "POST", path, body, headers: {} });
  }

  async request<T>(
    request: Omit<HttpRequest, "headers"> & {
      headers?: Record<string, string>;
    },
  ): Promise<Result<T>> {
    const req: HttpRequest = {
      ...request,
      headers: {
        Accept: "application/json",
        ...(request.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...request.headers,
      },
    };

    for (const interceptor of this.options.requestInterceptors ?? []) {
      await interceptor(req);
    }

    const fetchFn = this.options.fetchFn ?? fetch;
    let response: Response;
    try {
      response = await fetchFn(`${this.options.baseUrl}${req.path}`, {
        method: req.method,
        headers: req.headers,
        body: req.body !== undefined ? JSON.stringify(req.body) : undefined,
        signal: AbortSignal.timeout(
          this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        ),
        cache: "no-store",
      });
    } catch {
      return fail(
        "NETWORK",
        "اتصال به سامانه برقرار نشد. اینترنت خود را بررسی کنید.",
      );
    }

    for (const interceptor of this.options.responseInterceptors ?? []) {
      await interceptor(response, req);
    }

    if (!response.ok) {
      // Contract: error bodies are { code, message } with a Persian,
      // user-showable message (doc/<feature>/api.md). Anything else falls
      // back to a status-derived Persian message.
      let body: HttpErrorBody = {};
      try {
        body = (await response.json()) as HttpErrorBody;
      } catch {
        /* non-JSON error body */
      }
      return fail(
        body.code ?? `HTTP_${response.status}`,
        body.message ?? messageForStatus(response.status),
      );
    }

    if (response.status === 204) {
      return ok(undefined as T);
    }

    try {
      return ok((await response.json()) as T);
    } catch {
      return fail("BAD_RESPONSE", "پاسخ سامانه قابل خواندن نبود.");
    }
  }
}
