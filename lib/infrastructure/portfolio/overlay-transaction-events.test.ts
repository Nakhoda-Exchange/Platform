import { describe, expect, test } from "bun:test";
import type { Transaction } from "@/lib/core/domain/wallet/transaction";
import { overlayTransactionEvents } from "./overlay-transaction-events";

const HOUR = 3_600_000;
const START = 1_000_000_000_000;

/** Five hourly points at a flat 1000 value. */
const flat = () =>
  Array.from({ length: 5 }, (_, i) => ({
    at: START + i * HOUR,
    valueIrt: 1_000,
  }));

const tx = (
  type: Transaction["type"],
  status: Transaction["status"],
  at: number,
  amountIrt: number,
): Transaction => ({ id: "t", type, status, at: new Date(at), amountIrt });

describe("overlayTransactionEvents", () => {
  test("a deposit marks its nearest point and lowers all earlier points", () => {
    const out = overlayTransactionEvents(flat(), [
      tx("deposit", "done", START + 2 * HOUR, 300),
    ]);
    expect(out[2].event).toEqual({ type: "deposit", amountIrt: 300 });
    expect(out.map((p) => p.valueIrt)).toEqual([700, 700, 1_000, 1_000, 1_000]);
  });

  test("a withdrawal marks its point and raises all earlier points", () => {
    const out = overlayTransactionEvents(flat(), [
      tx("withdraw", "pending", START + 3 * HOUR, 200),
    ]);
    expect(out[3].event).toEqual({ type: "withdraw", amountIrt: 200 });
    expect(out.map((p) => p.valueIrt)).toEqual([
      1_200, 1_200, 1_200, 1_000, 1_000,
    ]);
  });

  test("failed withdrawals, trades, and out-of-window moves are ignored", () => {
    const out = overlayTransactionEvents(flat(), [
      tx("withdraw", "failed", START + HOUR, 200),
      tx("buy", "done", START + HOUR, 500),
      tx("deposit", "done", START - 10 * HOUR, 400),
    ]);
    expect(out.every((p) => p.event === undefined)).toBe(true);
    expect(out.map((p) => p.valueIrt)).toEqual([
      1_000, 1_000, 1_000, 1_000, 1_000,
    ]);
  });

  test("moves landing on the same point merge into one net event", () => {
    const out = overlayTransactionEvents(flat(), [
      tx("deposit", "done", START + 2 * HOUR, 500),
      tx("withdraw", "done", START + 2 * HOUR, 200),
    ]);
    expect(out[2].event).toEqual({ type: "deposit", amountIrt: 300 });
    expect(out[0].valueIrt).toBe(700); // -500 + 200
  });

  test("values never drop below the positive floor", () => {
    const out = overlayTransactionEvents(flat(), [
      tx("deposit", "done", START + 4 * HOUR, 5_000),
    ]);
    expect(out.slice(0, 4).every((p) => p.valueIrt > 0)).toBe(true);
  });
});
