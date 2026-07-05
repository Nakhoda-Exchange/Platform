import { describe, expect, test } from "bun:test";
import { isValidCardNumber, normalizeCardNumber } from "./bank-card";

describe("normalizeCardNumber", () => {
  test("accepts Persian digits, spaces and dashes", () => {
    expect(normalizeCardNumber("۶۲۱۹-۸۶۱۹ ۰۰۰۴ ۵۸۷۵")).toBe("6219861900045875");
  });
  test("rejects wrong lengths", () => {
    expect(normalizeCardNumber("123")).toBeNull();
    expect(normalizeCardNumber("12345678901234567")).toBeNull();
  });
});

describe("isValidCardNumber (Luhn)", () => {
  test("accepts a Luhn-valid card", () => {
    expect(isValidCardNumber("6037997599571347")).toBe(true);
  });
  test("rejects a Luhn-invalid card", () => {
    expect(isValidCardNumber("6037997599571346")).toBe(false);
  });
});
