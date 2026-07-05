import { describe, expect, test } from "bun:test";
import { checkPassword, isStrongPassword } from "./two-step-password";

describe("checkPassword", () => {
  test("reports each rule independently", () => {
    expect(checkPassword("abc")).toEqual({
      minLength: false,
      upper: false,
      lower: true,
      digit: false,
    });
    expect(checkPassword("ABCDEFGH1")).toEqual({
      minLength: true,
      upper: true,
      lower: false,
      digit: true,
    });
  });
});

describe("isStrongPassword", () => {
  test("requires all four rules", () => {
    expect(isStrongPassword("Nakhoda1")).toBe(true);
    expect(isStrongPassword("nakhoda1")).toBe(false); // no upper
    expect(isStrongPassword("NAKHODA1")).toBe(false); // no lower
    expect(isStrongPassword("Nakhodaa")).toBe(false); // no digit
    expect(isStrongPassword("Na1x")).toBe(false); // too short
  });
});
