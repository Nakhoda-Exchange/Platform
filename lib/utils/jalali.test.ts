import { describe, expect, test } from "bun:test";
import { toGregorian } from "jalaali-js";
import {
  isValidJalaliDate,
  jalaliAgeInYears,
  normalizeJalaliDate,
} from "./jalali";

describe("normalizeJalaliDate", () => {
  test("normalizes Persian digits, dashes, and short parts", () => {
    expect(normalizeJalaliDate("۱۳۷۵/۵/۲")).toBe("1375/05/02");
    expect(normalizeJalaliDate("1375-05-12")).toBe("1375/05/12");
  });

  test("rejects malformed, out-of-range, or impossible dates", () => {
    expect(normalizeJalaliDate("1375/13/01")).toBeNull();
    expect(normalizeJalaliDate("1375/00/01")).toBeNull();
    expect(normalizeJalaliDate("1200/01/01")).toBeNull(); // outside birth window
    expect(normalizeJalaliDate("abc")).toBeNull();
  });

  test("enforces month length and leap year (via jalaali-js)", () => {
    expect(isValidJalaliDate("1399/12/30")).toBe(true); // 1399 is leap
    expect(isValidJalaliDate("1400/12/30")).toBe(false); // 1400 is not
    expect(isValidJalaliDate("1375/07/31")).toBe(false); // month 7 has 30 days
  });
});

describe("jalaliAgeInYears", () => {
  test("counts whole years, flipping on the birthday", () => {
    const { gy, gm, gd } = toGregorian(1387, 1, 1);
    const onBirthday = new Date(gy + 16, gm - 1, gd);
    const dayBefore = new Date(gy + 16, gm - 1, gd - 1);
    expect(jalaliAgeInYears("1387/01/01", onBirthday)).toBe(16);
    expect(jalaliAgeInYears("1387/01/01", dayBefore)).toBe(15);
  });

  test("returns null for a malformed date", () => {
    expect(jalaliAgeInYears("nope")).toBeNull();
  });
});
