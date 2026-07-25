import { describe, expect, test } from "bun:test";
import { isSafeUrl, renderMarkdown } from "./safe-markdown";

describe("isSafeUrl", () => {
  test("accepts the schemes a link legitimately uses", () => {
    expect(isSafeUrl("https://nakhoda.trade")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("mailto:info@nakhoda.trade")).toBe(true);
    expect(isSafeUrl("tel:+982112345678")).toBe(true);
  });

  test("accepts relative URLs (no scheme ⇒ same origin)", () => {
    expect(isSafeUrl("/wallet")).toBe(true);
    expect(isSafeUrl("./deposit")).toBe(true);
    expect(isSafeUrl("#section")).toBe(true);
  });

  test("rejects script-bearing schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  test("rejects the obfuscations that defeat a startsWith check", () => {
    // The browser normalizes all of these back to `javascript:`; a naive prefix
    // match does not, which is why the scheme is parsed rather than compared.
    expect(isSafeUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeUrl("  javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("java\tscript:alert(1)")).toBe(false);
    expect(isSafeUrl("java\nscript:alert(1)")).toBe(false);
  });

  test("rejects an empty or blank URL", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl("   ")).toBe(false);
  });
});

describe("renderMarkdown", () => {
  test("renders ordinary markdown", async () => {
    const html = await renderMarkdown("# سلام\n\nمتن **پررنگ**.");
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>پررنگ</strong>");
  });

  test("drops raw script tags instead of passing them through", async () => {
    const html = await renderMarkdown(
      "before\n\n<script>alert(1)</script>\n\nafter",
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
    expect(html).toContain("before");
    expect(html).toContain("after");
  });

  test("drops raw HTML carrying an event handler", async () => {
    const html = await renderMarkdown('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<img");
  });

  test("drops inline raw HTML too, not just block-level", async () => {
    const html = await renderMarkdown(
      "text <b onmouseover=alert(1)>hover</b> more",
    );
    expect(html).not.toContain("onmouseover");
  });

  test("strips a javascript: href from a markdown link", async () => {
    const html = await renderMarkdown("[tap me](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    // The label survives — the author can see the link was rejected.
    expect(html).toContain("tap me");
  });

  test("strips a javascript: src from a markdown image", async () => {
    const html = await renderMarkdown("![x](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
  });

  test("strips an entity-encoded javascript: URL", async () => {
    // marked escapes `&`, so a hostile URL arrives entity-encoded; the check
    // decodes before judging.
    const html = await renderMarkdown("[x](&#106;avascript:alert(1))");
    expect(html.toLowerCase()).not.toContain("javascript:");
  });

  test("keeps legitimate links and images intact", async () => {
    const html = await renderMarkdown(
      "[site](https://nakhoda.trade) and ![logo](/logo.png)",
    );
    expect(html).toContain('href="https://nakhoda.trade"');
    expect(html).toContain('src="/logo.png"');
  });
});
