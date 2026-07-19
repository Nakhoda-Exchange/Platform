import { describe, expect, test } from "bun:test";
import {
  formatChangePercent,
  formatCoinAmount,
  formatIrt,
  formatIrtShort,
  formatMarketCap,
  formatUsd,
  setCurrencyUnits,
} from "./money";

// Unit labels are server config; tests inject them like the root layout does.
setCurrencyUnits({ irt: "تومان", usd: "دلار" });

describe("formatCoinAmount", () => {
  test("Persian digits, fractional and grouped", () => {
    expect(formatCoinAmount(0.0015)).toBe("۰٫۰۰۱۵");
    expect(formatCoinAmount(5)).toBe("۵");
    expect(formatCoinAmount(12500)).toBe("۱۲٬۵۰۰");
  });

  test("scales precision by magnitude (large ≤ 2 dp, tiny up to 8 dp)", () => {
    expect(formatCoinAmount(1234.567)).toBe("۱٬۲۳۴٫۵۷"); // large → max 2 dp
    expect(formatCoinAmount(0.00001234)).toBe("۰٫۰۰۰۰۱۲۳۴"); // tiny → 8 dp
    expect(formatCoinAmount(0)).toBe("۰");
  });
});

describe("formatIrt", () => {
  test("groups thousands in Persian digits + تومان", () => {
    expect(formatIrt(12450000)).toBe("\u2067۱۲٬۴۵۰٬۰۰۰ تومان\u2069");
    expect(formatIrt(4500)).toBe("\u2067۴٬۵۰۰ تومان\u2069");
  });

  test("keeps decimals for small fractional prices (memecoins)", () => {
    expect(formatIrt(0.18)).toBe("\u2067۰٫۱۸ تومان\u2069");
  });
});

describe("formatIrtShort", () => {
  test("uses the short ت unit for dense rows", () => {
    expect(formatIrtShort(4500)).toBe("\u2067۴٬۵۰۰ تومان\u2069");
    expect(formatIrtShort(0.18)).toBe("\u2067۰٫۱۸ تومان\u2069");
  });
});

describe("formatMarketCap", () => {
  test("grouped Persian digits + همت", () => {
    expect(formatMarketCap(85000)).toBe("\u2067۸۵٬۰۰۰ همت\u2069");
    expect(formatMarketCap(555)).toBe("\u2067۵۵۵ همت\u2069");
  });
});

describe("formatUsd", () => {
  test("Persian digits with spelled دلار", () => {
    expect(formatUsd(4120)).toBe("\u2067۴٬۱۲۰ دلار\u2069");
    expect(formatUsd(0.07)).toBe("\u2067۰٫۰۷ دلار\u2069");
  });
});

describe("formatChangePercent", () => {
  test("unsigned, Persian decimal + percent", () => {
    expect(formatChangePercent(3.2)).toBe("۳٫۲٪");
    expect(formatChangePercent(-2.1)).toBe("۲٫۱٪");
  });
});
