import { describe, expect, it } from "bun:test";
import {
  GENERIC_ERROR_MESSAGE,
  isPersianText,
  userFacingMessage,
} from "./error-copy";

const hasLatinLetters = (s: string): boolean => /[A-Za-z]/.test(s);

describe("userFacingMessage", () => {
  it("swallows an ENGLISH backend message rather than showing it", () => {
    // The real regression: the trade engine published its own domain string.
    expect(
      userFacingMessage(
        "SOME_NEW_CODE",
        "order size 300000 IRT is below the minimum 500000 IRT",
      ),
    ).toBe(GENERIC_ERROR_MESSAGE);
  });

  it("pins its own Persian copy for a known code, ignoring what was sent", () => {
    expect(
      userFacingMessage("INSUFFICIENT_IRT", "insufficient IRT balance"),
    ).toBe("موجودی تومانی شما کافی نیست.");
  });

  it("gives ONE generic sentence for faults the user cannot act on", () => {
    // Even a perfectly Persian «این درخواست قبلاً ثبت شده است» tells a user
    // nothing here — it describes our race, not their order.
    for (const code of [
      "INTERNAL_ERROR",
      "BAD_RESPONSE",
      "CONCURRENT_MODIFICATION",
      "VALIDATION_ERROR",
    ]) {
      expect(userFacingMessage(code, "اطلاعات ارسالی نامعتبر است.")).toBe(
        GENERIC_ERROR_MESSAGE,
      );
    }
  });

  it("passes a Persian message through for an unknown, non-internal code", () => {
    // Codes that carry a live figure (a limit, an amount) must keep their real
    // number rather than collapse to something vaguer.
    const message = "کمینه مبلغ این سفارش ۵۰۰٬۰۰۰ تومان است.";
    expect(userFacingMessage("BELOW_MIN_ORDER_V2", message)).toBe(message);
  });

  it("never returns an empty or English string for any input", () => {
    for (const message of [undefined, null, "", "   ", "Bad Gateway"]) {
      const out = userFacingMessage(undefined, message);
      expect(out.length).toBeGreaterThan(0);
      expect(hasLatinLetters(out)).toBe(false);
    }
  });

  it("does not claim an unconfirmed submit failed", () => {
    // The order may have executed; copy that says «ناموفق» would be a lie the
    // user acts on by re-submitting.
    const message = userFacingMessage("SUBMIT_UNCONFIRMED");
    expect(message).toContain("دریافت نشد");
    expect(message).not.toContain("ناموفق");
  });
});

describe("isPersianText", () => {
  it("recognises Persian prose and rejects Latin", () => {
    expect(isPersianText("موجودی کافی نیست")).toBe(true);
    expect(isPersianText("insufficient balance")).toBe(false);
    expect(isPersianText("")).toBe(false);
    expect(isPersianText(undefined)).toBe(false);
  });
});
