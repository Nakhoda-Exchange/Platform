import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { COOKIE_OPTIONS } from "./cookie-options";

describe("COOKIE_OPTIONS", () => {
  test("carries the flags every cookie needs", () => {
    expect(COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(COOKIE_OPTIONS.sameSite).toBe("lax");
    expect(COOKIE_OPTIONS.path).toBe("/");
  });

  test("gates Secure on production (dev serves plain http://localhost)", () => {
    // Under `bun test` NODE_ENV is "test", so Secure is off here — asserting the
    // gate itself, since a Secure cookie is silently dropped over http and every
    // dependent flow would break in a way that looks like a logic bug.
    expect(COOKIE_OPTIONS.secure).toBe(process.env.NODE_ENV === "production");
  });
});

/**
 * Regression guard for issue #66. The bug was not that someone chose insecure
 * flags — it was that five call sites each hand-wrote their own flag list and
 * one drifted. Centralizing only helps if new code keeps using the shared
 * constant, so this fails the build when a call site hand-rolls flags again.
 */
describe("no hand-rolled cookie flags", () => {
  const ROOTS = ["app", "lib", "components"];
  const SKIP = new Set(["node_modules", ".next"]);

  function sourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      if (SKIP.has(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        out.push(...sourceFiles(full));
      } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
        out.push(full);
      }
    }
    return out;
  }

  // The definition itself legitimately spells the flags out, and its usage
  // example contains a `cookies().set(...)` line — it is the one exemption.
  const DEFINITION = join("lib", "utils", "cookie-options.ts");

  test("every cookie is set through COOKIE_OPTIONS", () => {
    const offenders = sourceFiles(".")
      .filter((f) => ROOTS.some((r) => f.startsWith(r)))
      .filter((f) => f !== DEFINITION)
      .filter((f) => {
        const src = readFileSync(f, "utf8");
        // A cookie write that hand-writes httpOnly instead of spreading the
        // shared options — the exact shape that let one site miss `secure`.
        return (
          /cookies\(\)\)?\.set\(/.test(src) && /httpOnly:\s*true/.test(src)
        );
      });
    expect(offenders).toEqual([]);
  });
});
