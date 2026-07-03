import { describe, expect, test } from "bun:test";
import { isValidNationalCode, NationalCode } from "./national-code";

describe("isValidNationalCode", () => {
  test("accepts valid codes", () => {
    expect(isValidNationalCode("0499370899")).toBe(true);
    expect(isValidNationalCode("0084575948")).toBe(true);
  });

  test("accepts Persian digits", () => {
    expect(isValidNationalCode("۰۴۹۹۳۷۰۸۹۹")).toBe(true);
  });

  test("rejects wrong checksum, wrong length, all-identical", () => {
    expect(isValidNationalCode("0499370898")).toBe(false);
    expect(isValidNationalCode("123")).toBe(false);
    expect(isValidNationalCode("1111111111")).toBe(false);
  });
});

describe("NationalCode.create", () => {
  test("normalizes Persian digits on success", () => {
    const result = NationalCode.create("۰۴۹۹۳۷۰۸۹۹");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.value).toBe("0499370899");
  });

  test("fails for an invalid code", () => {
    expect(NationalCode.create("123").ok).toBe(false);
  });
});
