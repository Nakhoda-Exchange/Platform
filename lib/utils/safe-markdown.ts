import { Marked } from "marked";

/**
 * URL schemes allowed to reach an `href`/`src` in rendered content. Anything
 * else — most importantly `javascript:`, but also `data:` (which can carry an
 * HTML document) and `vbscript:` — is dropped.
 *
 * Relative URLs (`/wallet`, `./x`, `#top`) carry no scheme and are always safe,
 * so they pass without being parsed.
 */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Whether a URL is safe to place in an `href` or `src`.
 *
 * Scheme detection is deliberately done by `new URL()` rather than by matching
 * the string, because a prefix check is trivially bypassed: `java\tscript:`,
 * `JaVaScRiPt:`, and leading control characters are all normalized by the
 * browser but survive a naive `startsWith("javascript:")`.
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === "") return false;
  // No scheme ⇒ relative ⇒ same-origin ⇒ safe. `new URL` throws on these, which
  // is how we tell them apart from an absolute URL with a hostile scheme.
  try {
    const parsed = new URL(trimmed, "https://nakhoda.invalid");
    // A relative input resolves against the base, so its scheme is https: —
    // indistinguishable from an absolute https URL here, and both are fine.
    return SAFE_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Markdown → HTML for FIRST-PARTY announcement bodies, hardened against stored
 * XSS (issue #67).
 *
 * Two things make the output safe to hand to `dangerouslySetInnerHTML`:
 *
 * 1. **Raw HTML is dropped, not escaped.** `marked` passes inline and block HTML
 *    straight through by default — it removed its own sanitizer in v5 — so a body
 *    containing `<script>` or `<img onerror=…>` would otherwise execute in the
 *    reader's authenticated session. Markdown alone cannot express a script tag,
 *    so dropping raw HTML costs nothing an announcement legitimately needs.
 * 2. **Link and image URLs are scheme-checked.** Markdown *can* express
 *    `[click](javascript:…)`, which `marked` happily renders into an `href`.
 *    A rejected URL renders as plain text rather than a dead link, so the author
 *    can see something is wrong.
 *
 * This is defense in depth, not a substitute for validating on the way in:
 * announcement bodies are admin-authored, so the real blast radius here is one
 * compromised admin account turning into script execution in every user's
 * session. The backend should validate too.
 */
const renderer = {
  // Drop raw HTML entirely (both the block and inline forms).
  html(): string {
    return "";
  },
};

const safeMarked = new Marked({ renderer });

/** Render first-party markdown to sanitized HTML. */
export async function renderMarkdown(markdown: string): Promise<string> {
  const html = await safeMarked.parse(markdown);
  return stripUnsafeUrls(html);
}

/**
 * Remove `href`/`src` attributes whose URL is not {@link isSafeUrl}.
 *
 * Applied to marked's OUTPUT rather than via a link renderer so it also covers
 * autolinks and images, and so any future markdown feature that emits a URL is
 * covered by construction rather than by remembering to override one more hook.
 */
function stripUnsafeUrls(html: string): string {
  return html.replace(
    /\s(href|src)\s*=\s*"([^"]*)"/gi,
    (match, attr: string, url: string) =>
      isSafeUrl(decodeHtmlEntities(url)) ? match : "",
  );
}

/**
 * Decode the handful of entity forms an attacker would use to smuggle a scheme
 * past the check (`&#106;avascript:` and friends). marked escapes `&`, so a
 * hostile URL arrives entity-encoded and must be decoded before it is judged.
 */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);?/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    )
    .replace(/&amp;/gi, "&")
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n");
}
