/**
 * The last line of defence between a backend error and a Persian-speaking user.
 *
 * The API contract says every error body carries a user-showable Persian
 * `message` (`doc/api-conventions.md`), and the app used to render that string
 * verbatim in a toast. Two things went wrong with trusting it:
 *
 *  1. **English leaked.** The trade engine published its own domain messages —
 *     «order size 300000 IRT is below the minimum 500000 IRT» reached the toast
 *     as-is. A contract the UI cannot enforce is a contract that eventually
 *     breaks; the fix belongs on both sides.
 *  2. **Irrelevant detail leaked.** «CONCURRENT_MODIFICATION», «BAD_RESPONSE»,
 *     a zod «VALIDATION_ERROR» — even phrased in Persian, none of these tell a
 *     user anything they can act on. They are our problem, not theirs, and they
 *     should read as one plain sentence.
 *
 * So the message a user sees is decided HERE, by `code` — the stable half of
 * the contract — and a backend sentence is only passed through when it is
 * genuinely Persian AND its code isn't one of the internal ones.
 */

/** What a user sees when the real reason is ours, not theirs. */
export const GENERIC_ERROR_MESSAGE = "خطایی رخ داد. لطفاً دوباره تلاش کنید.";

/**
 * Codes whose real message is never worth showing, however it is phrased: an
 * internal fault, a race we lost, or a validation failure that means the CLIENT
 * built a bad request (which the user cannot fix by reading about it).
 */
const INTERNAL_CODES = new Set([
  "INTERNAL_ERROR",
  "HTTP_ERROR",
  "HTTP_500",
  "HTTP_502",
  "HTTP_504",
  "BAD_RESPONSE",
  "VALIDATION_ERROR",
  "CONCURRENT_MODIFICATION",
  "MISSING_IDEMPOTENCY_KEY",
  "INVALID_AMOUNT",
  "INVALID_TARGET_PRICE",
  "TRADE_ERROR",
]);

/**
 * Persian copy per stable error code. Where the backend already sends good
 * Persian this simply pins it, so the wording survives a backend regression and
 * stays consistent across the screens that raise the same code.
 *
 * Codes that legitimately carry a VARIABLE message (a limit figure, an amount)
 * are deliberately absent — those pass through the Persian check below so the
 * user gets the real number rather than a vaguer fixed sentence.
 */
const MESSAGE_BY_CODE: Record<string, string> = {
  // Transport / session
  NETWORK: "اتصال به سامانه برقرار نشد. اینترنت خود را بررسی کنید.",
  TIMEOUT: "پاسخی از سامانه دریافت نشد. لطفاً دوباره تلاش کنید.",
  UNAUTHORIZED: "نشست شما منقضی شده است. دوباره وارد شوید.",
  HTTP_401: "نشست شما منقضی شده است. دوباره وارد شوید.",
  FORBIDDEN: "اجازه این کار را ندارید.",
  HTTP_403: "اجازه این کار را ندارید.",
  NOT_FOUND: "موردی پیدا نشد.",
  HTTP_404: "موردی پیدا نشد.",
  TOO_MANY_REQUESTS: "درخواست‌های شما زیاد بوده است. کمی بعد دوباره تلاش کنید.",
  HTTP_429: "درخواست‌های شما زیاد بوده است. کمی بعد دوباره تلاش کنید.",
  HTTP_503: "سامانه موقتاً در دسترس نیست. کمی بعد دوباره تلاش کنید.",

  // Pricing — momentary, and every one of them means «try again in a moment»
  PRICE_UNAVAILABLE:
    "قیمت لحظه‌ای در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
  PRICE_STALE: "قیمت لحظه‌ای به‌روز شد. لطفاً دوباره تأیید کنید.",
  PRICE_OUT_OF_TOLERANCE: "قیمت بازار تغییر کرد. لطفاً دوباره تأیید کنید.",
  QUOTE_EXPIRED: "مهلت این قیمت تمام شد. لطفاً دوباره تأیید کنید.",
  QUOTE_MISMATCH: "قیمت این سفارش به‌روز شد. لطفاً دوباره تأیید کنید.",

  // Order placement
  EMPTY_AMOUNT: "مبلغ سفارش را وارد کنید.",
  UNKNOWN_COIN: "این رمزارز قابل معامله نیست.",
  INSUFFICIENT_IRT: "موجودی تومانی شما کافی نیست.",
  INSUFFICIENT_COIN: "موجودی این رمزارز کافی نیست.",
  INSUFFICIENT_FUNDS: "موجودی شما برای این سفارش کافی نیست.",
  INSUFFICIENT_BALANCE: "موجودی شما برای این سفارش کافی نیست.",
  GAS_TOO_HIGH:
    "کارمزد شبکه نسبت به مبلغ این سفارش زیاد است. مبلغ بیشتری را امتحان کنید.",
  ORDER_REJECTED: "انجام سفارش ممکن نشد. لطفاً دوباره تلاش کنید.",
  SUBMISSION_IN_FLIGHT: "این سفارش در حال ثبت است. لطفاً کمی صبر کنید.",
  LIMITS_UNAVAILABLE:
    "محدودیت‌های معامله در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.",
  TRADING_HALTED: "معامله این رمزارز موقتاً متوقف است.",
  VENUE_UNAVAILABLE: "امکان انجام این معامله در حال حاضر نیست.",
  INSUFFICIENT_LIQUIDITY:
    "نقدینگی کافی برای این مقدار وجود ندارد. مقدار کمتری را امتحان کنید.",
  KYC_REQUIRED: "برای معامله باید احراز هویت خود را کامل کنید.",

  // Orders list
  ORDER_NOT_FOUND: "این سفارش پیدا نشد.",
  ORDER_ALREADY_EXECUTED: "این سفارش پیش‌تر انجام شده و دیگر قابل لغو نیست.",
  ORDER_NOT_CANCELLABLE: "این سفارش دیگر قابل لغو نیست.",

  /**
   * The submit left but no answer came back. NOT a failure — the order may well
   * have executed — so the copy must not claim it didn't. See
   * `SUBMIT_UNCONFIRMED` in the trade adapter.
   */
  SUBMIT_UNCONFIRMED:
    "پاسخ سامانه دریافت نشد. اگر سفارش ثبت شده باشد در «سفارش‌ها» و «دارایی» دیده می‌شود؛ پیش از تلاش دوباره آن را بررسی کنید.",
};

/**
 * Whether a string is actually Persian prose. Presence of Arabic-script letters
 * is the signal; a message that is pure Latin (or empty) is not something a
 * Persian-speaking user should be shown, whatever the contract promised.
 */
export function isPersianText(text: string | undefined | null): boolean {
  return typeof text === "string" && /[؀-ۿ]/.test(text);
}

/**
 * The message to actually show for a `{ code, message }` error.
 *
 * Resolution order: pinned copy for the code → the backend's own message when
 * it is Persian and the code isn't an internal one → the generic sentence.
 * Never returns an English string, and never returns an empty one.
 */
export function userFacingMessage(
  code: string | undefined | null,
  message?: string | null,
): string {
  const pinned = code ? MESSAGE_BY_CODE[code] : undefined;
  if (pinned) return pinned;
  if (code && INTERNAL_CODES.has(code)) return GENERIC_ERROR_MESSAGE;
  if (isPersianText(message)) return message!;
  return GENERIC_ERROR_MESSAGE;
}
