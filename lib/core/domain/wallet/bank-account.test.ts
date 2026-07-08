import { expect, test } from "bun:test";
import { isValidIban, normalizeIban, sameOwner } from "./bank-account";
import { isValidCardNumber } from "./bank-card";

test("normalizeIban strips IR/spaces/digits and rejects bad shapes", () => {
  expect(normalizeIban("IR06 0120 0000 0000 0012 3456 78")).toBe(
    "IR060120000000000012345678",
  );
  expect(normalizeIban("۰۶۰۱۲۰۰۰۰۰۰۰۰۰۰۰۱۲۳۴۵۶۷۸")).toBe(
    "IR060120000000000012345678",
  );
  expect(normalizeIban("IR12")).toBeNull(); // too short
});

test("isValidIban enforces the mod-97 checksum", () => {
  expect(isValidIban("IR062960000000100324200001")).toBe(true);
  expect(isValidIban("IR062960000000100324200002")).toBe(false); // wrong check digits
});

test("the documented «someone else's» test values pass validation (so the inquiry runs)", () => {
  // Both end in 0000 → the mock treats them as another person's, exercising
  // the NOT_OWNER path; they must still be checksum-valid to reach the inquiry.
  expect(isValidCardNumber("5022000000030000")).toBe(true);
  expect(isValidIban("IR450620000000200000730000")).toBe(true);
});

test("sameOwner is lenient about ZWNJ/whitespace but not identity", () => {
  expect(sameOwner("علی رضایی", "علی  رضایی")).toBe(true);
  expect(sameOwner("علی رضایی", "زهرا محمدی")).toBe(false);
  expect(sameOwner("", "")).toBe(false);
});
