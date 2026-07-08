import { describe, expect, test } from "bun:test";
import { detectBankByCard, detectBankByIban, sameBank } from "./iranian-banks";

describe("detectBankByCard", () => {
  test("resolves known BINs", () => {
    expect(detectBankByCard("6037997599571347")?.id).toBe("melli");
    expect(detectBankByCard("6104339999999999")?.id).toBe("mellat");
    expect(detectBankByCard("6219861900045875")?.id).toBe("saman");
  });
  test("accepts Persian digits and separators", () => {
    expect(detectBankByCard("۶۲۱۹-۸۶۱۹ ۰۰۰۴ ۵۸۷۵")?.id).toBe("saman");
  });
  test("returns null for an unrecognized BIN", () => {
    expect(detectBankByCard("999999")).toBeNull();
  });
});

describe("detectBankByIban", () => {
  test("extracts the bank code from positions 3-5", () => {
    // IR + 2 check digits + 017 (melli) + 19-digit account, not checksum-valid.
    expect(detectBankByIban("IR000170000000000000000001")?.id).toBe("melli");
  });
  test("returns null for an unrecognized bank code", () => {
    expect(detectBankByIban("IR000990000000000000000001")).toBeNull();
  });
});

describe("sameBank", () => {
  test("true for a card and IBAN of the same bank", () => {
    expect(sameBank("6037997599571347", "IR000170000000000000000001")).toBe(
      true,
    );
  });
  test("false across banks", () => {
    expect(sameBank("6037997599571347", "IR000120000000000000000001")).toBe(
      false,
    );
  });
  test("false when either side is unrecognized", () => {
    expect(sameBank("9999990000000000", "IR000170000000000000000001")).toBe(
      false,
    );
  });
});
