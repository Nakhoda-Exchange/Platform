import { describe, expect, test } from "bun:test";
import { mapRugCheck } from "./rugcheck.provider";
import type { SafetySnapshot } from "@/lib/core/application/insights/ports/insights.port";

const NOW = 1_700_000_000_000;
const check = (snap: SafetySnapshot, id: string) =>
  snap.checks.find((c) => c.id === id);

describe("mapRugCheck", () => {
  test("renounced authorities pass; active authorities fail", () => {
    const pass = mapRugCheck(
      { mintAuthority: null, freezeAuthority: null },
      NOW,
    );
    expect(check(pass, "mint_authority")!.status).toBe("pass");
    expect(check(pass, "freeze_authority")!.status).toBe("pass");

    const fail = mapRugCheck(
      { mintAuthority: "MintAuth1", freezeAuthority: "FreezeAuth1" },
      NOW,
    );
    expect(check(fail, "mint_authority")!.status).toBe("fail");
    expect(check(fail, "freeze_authority")!.status).toBe("fail");
  });

  test("maps LP lock, risks, top holders and holder count", () => {
    const snap = mapRugCheck(
      {
        mintAuthority: null,
        freezeAuthority: null,
        markets: [{ lp: { lpLockedPct: 95, lpBurn: 0 } }],
        risks: [
          {
            name: "High holder concentration",
            level: "warn",
            description: "top holders own a large share",
          },
        ],
        topHolders: [{ address: "8xInsiderWallet", pct: 12, insider: true }],
        totalHolders: 3400,
      },
      NOW,
    );
    expect(check(snap, "lp_locked")!.status).toBe("pass"); // 95% ≥ 80
    expect(snap.lp.lockedPercent).toBe(95);
    expect(snap.checks.some((c) => c.status === "warn")).toBe(true);
    expect(snap.topHolders[0].label).toBe("insider");
    expect(snap.holderCount).toBe(3400);
    // every check is attributed and timestamped
    expect(snap.checks.every((c) => c.source === "rugcheck")).toBe(true);
    expect(snap.checks.every((c) => c.lastUpdatedAt === NOW)).toBe(true);
  });

  test("low LP lock fails the check", () => {
    const snap = mapRugCheck(
      {
        mintAuthority: null,
        freezeAuthority: null,
        markets: [{ lp: { lpLockedPct: 10 } }],
      },
      NOW,
    );
    expect(check(snap, "lp_locked")!.status).toBe("fail"); // 10% < 30
  });
});
