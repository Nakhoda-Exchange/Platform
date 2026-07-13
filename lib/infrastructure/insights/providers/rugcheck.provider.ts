import { ok, type Result } from "@/lib/core/domain/shared/result";
import type { TokenIdentity } from "@/lib/core/domain/shared/token-identity";
import type {
  LpStatus,
  SafetyCheck,
  TopHolder,
} from "@/lib/core/domain/insights/token-insights";
import type {
  SafetyProvider,
  SafetySnapshot,
} from "@/lib/core/application/insights/ports/insights.port";
import { fetchJson } from "./fetch-json";

/**
 * RugCheck.xyz — Solana token safety, keyless. Provides the Safety capability.
 * Endpoint: GET https://api.rugcheck.xyz/v1/tokens/{mint}/report
 * NOTE: mapping is defensive against documented fields; verify against a live
 *   report and tighten once a key/sample is available (see doc/insights/providers.md).
 */

interface RugCheckRisk {
  name?: string;
  description?: string;
  level?: string; // "danger" | "warn" | "info"
}
interface RugCheckMarketLp {
  lpLockedPct?: number;
  lpBurn?: number;
}
interface RugCheckReport {
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  totalHolders?: number;
  risks?: RugCheckRisk[];
  topHolders?: { address: string; pct?: number; insider?: boolean }[];
  markets?: { lp?: RugCheckMarketLp }[];
}

function levelToStatus(level?: string): SafetyCheck["status"] {
  if (level === "danger") return "fail";
  if (level === "warn") return "warn";
  return "unknown";
}

/** Pure DTO → SafetySnapshot (tested). */
export function mapRugCheck(
  report: RugCheckReport,
  now: number,
): SafetySnapshot {
  const checks: SafetyCheck[] = [];
  const base = { source: "rugcheck" as const, lastUpdatedAt: now };

  checks.push({
    ...base,
    id: "mint_authority",
    label: "اختیار ضرب توکن",
    status: report.mintAuthority == null ? "pass" : "fail",
    detail:
      report.mintAuthority == null
        ? "اختیار ضرب لغو شده — امکان چاپ توکن جدید وجود ندارد."
        : "اختیار ضرب فعال است — سازنده می‌تواند توکن جدید چاپ کند.",
  });
  checks.push({
    ...base,
    id: "freeze_authority",
    label: "اختیار فریز حساب",
    status: report.freezeAuthority == null ? "pass" : "fail",
    detail:
      report.freezeAuthority == null
        ? "اختیار فریز لغو شده."
        : "اختیار فریز فعال است — امکان مسدودسازی انتقال‌ها.",
  });

  const lpPct = report.markets?.[0]?.lp?.lpLockedPct ?? null;
  const lpBurn = report.markets?.[0]?.lp?.lpBurn ?? null;
  if (lpPct != null) {
    checks.push({
      ...base,
      id: "lp_locked",
      label: "قفل نقدینگی",
      status: lpPct >= 80 ? "pass" : lpPct >= 30 ? "warn" : "fail",
      detail: `${lpPct.toFixed(0)}٪ نقدینگی قفل/سوزانده شده است.`,
    });
  }

  for (const risk of report.risks ?? []) {
    if (!risk.name) continue;
    checks.push({
      ...base,
      id: `risk_${risk.name.toLowerCase().replace(/\s+/g, "_")}`,
      label: risk.name,
      status: levelToStatus(risk.level),
      detail: risk.description ?? "",
    });
  }

  const lp: LpStatus = {
    lockedPercent: lpPct,
    burnedPercent: lpBurn,
    lockedUntil: null,
  };
  const topHolders: TopHolder[] = (report.topHolders ?? []).map((h) => ({
    address: h.address,
    percent: h.pct ?? 0,
    isContract: false,
    label: h.insider ? "insider" : null,
  }));

  return {
    source: "rugcheck",
    fetchedAt: now,
    checks,
    lp,
    topHolders,
    holderCount: report.totalHolders ?? null,
  };
}

export class RugCheckProvider implements SafetyProvider {
  async getSafety(token: TokenIdentity): Promise<Result<SafetySnapshot>> {
    const res = await fetchJson<RugCheckReport>(
      `https://api.rugcheck.xyz/v1/tokens/${encodeURIComponent(token.address)}/report`,
    );
    if (!res.ok) return res;
    return ok(mapRugCheck(res.data, Date.now()));
  }
}
