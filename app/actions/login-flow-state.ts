import { cookies } from "next/headers";
import { safeNextPath } from "./session-state";

/**
 * Short-lived httpOnly cookies that carry the in-flight login state so it never
 * rides in the URL (audit #1). `login_challenge` holds the OTP challenge between
 * /login and /login/verify; `login_status` holds the resolved login status
 * between the OTP step and the two-step gate. Both are cleared once consumed.
 * A real backend keeps this in the auth session — these cookies are the
 * mock-shaped stand-in until it lands.
 */
const CHALLENGE_COOKIE = "login_challenge";
const STATUS_COOKIE = "login_status";

// The challenge only needs to survive the hop to /login/verify plus a couple of
// resends; the status must also cover the forgot-password detour off the gate.
const CHALLENGE_MAX_AGE = 60 * 10; // 10 min
const STATUS_MAX_AGE = 60 * 20; // 20 min

const BASE = { httpOnly: true, sameSite: "lax", path: "/" } as const;

export interface LoginChallenge {
  cid: string;
  phone: string;
  rs: number;
  next: string | null;
}

export interface LoginStatusState {
  status: string;
  next: string | null;
}

export async function setLoginChallenge(value: LoginChallenge): Promise<void> {
  (await cookies()).set(CHALLENGE_COOKIE, JSON.stringify(value), {
    ...BASE,
    maxAge: CHALLENGE_MAX_AGE,
  });
}

export async function readLoginChallenge(): Promise<LoginChallenge | null> {
  const raw = (await cookies()).get(CHALLENGE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LoginChallenge>;
    if (typeof parsed.cid === "string" && typeof parsed.phone === "string") {
      return {
        cid: parsed.cid,
        phone: parsed.phone,
        rs: Number(parsed.rs) > 0 ? Number(parsed.rs) : 120,
        next: safeNextPath(parsed.next ?? undefined),
      };
    }
  } catch {
    // malformed cookie — treat as absent
  }
  return null;
}

export async function clearLoginChallenge(): Promise<void> {
  (await cookies()).delete(CHALLENGE_COOKIE);
}

export async function setLoginStatus(value: LoginStatusState): Promise<void> {
  (await cookies()).set(STATUS_COOKIE, JSON.stringify(value), {
    ...BASE,
    maxAge: STATUS_MAX_AGE,
  });
}

export async function readLoginStatus(): Promise<LoginStatusState | null> {
  const raw = (await cookies()).get(STATUS_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LoginStatusState>;
    if (typeof parsed.status === "string") {
      return {
        status: parsed.status,
        next: safeNextPath(parsed.next ?? undefined),
      };
    }
  } catch {
    // malformed cookie — treat as absent
  }
  return null;
}

export async function clearLoginStatus(): Promise<void> {
  (await cookies()).delete(STATUS_COOKIE);
}
