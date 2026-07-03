import { describe, expect, test } from "bun:test";
import { formatChangePercent, formatIrt, formatUsd } from "./money";

describe("formatIrt", () => {
  test("groups thousands in Persian digits + تومان", () => {
    expect(formatIrt(12450000)).toBe("۱۲٬۴۵۰٬۰۰۰ تومان");
    expect(formatIrt(4500)).toBe("۴٬۵۰۰ تومان");
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
