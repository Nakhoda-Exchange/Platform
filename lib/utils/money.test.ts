import { describe, expect, test } from "bun:test";
import {
  formatChangePercent,
  formatCoinAmount,
  formatIrt,
  formatIrtShort,
  formatMarketCap,
  formatUsd,
} from "./money";

describe("formatCoinAmount", () => {
  test("Persian digits, fractional and grouped", () => {
    expect(formatCoinAmount(0.0015)).toBe("۰٫۰۰۱۵");
    expect(formatCoinAmount(5)).toBe("۵");
    expect(formatCoinAmount(12500)).toBe("۱۲٬۵۰۰");
  });
});

describe("formatIrt", () => {
  test("groups thousands in Persian digits + تومان", () => {
    expect(formatIrt(12450000)).toBe("۱۲٬۴۵۰٬۰۰۰ تومان");
    expect(formatIrt(4500)).toBe("۴٬۵۰۰ تومان");
  });

  test("keeps decimals for small fractional prices (memecoins)", () => {
    expect(formatIrt(0.18)).toBe("۰٫۱۸ تومان");
  });
});

describe("formatIrtShort", () => {
  test("uses the short ت unit for dense rows", () => {
    expect(formatIrtShort(4500)).toBe("۴٬۵۰۰ ت");
    expect(formatIrtShort(0.18)).toBe("۰٫۱۸ ت");
  });
});

describe("formatMarketCap", () => {
  test("grouped Persian digits + همت", () => {
    expect(formatMarketCap(85000)).toBe("۸۵٬۰۰۰ همت");
    expect(formatMarketCap(555)).toBe("۵۵۵ همت");
  });
});

describe("formatUsd", () => {
  test("Latin digits with $ and grouping", () => {
    expect(formatUsd(4120)).toBe("$4,120");
    expect(formatUsd(0.07)).toBe("$0.07");
  });
});

describe("formatChangePercent", () => {
  test("unsigned, Persian decimal + percent", () => {
    expect(formatChangePercent(3.2)).toBe("۳٫۲٪");
    expect(formatChangePercent(-2.1)).toBe("۲٫۱٪");
  });
});
