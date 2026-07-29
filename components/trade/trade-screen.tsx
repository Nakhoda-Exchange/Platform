"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  FEE_RATE,
  maxOrderIrt,
  minOrderIrt,
  type OrderType,
  type PlacedOrder,
  type TradeContext,
  type TradeSide,
} from "@/lib/core/domain/trade/order";
import { coinDisplaySymbol } from "@/lib/core/domain/market/coin";
import { parsePrice, type PriceValue } from "@/lib/core/domain/market/price";
import { placeTradeOrder, resolveOrder } from "@/app/actions/trade";
import {
  PRICE_UNAVAILABLE_CODES,
  type TradeFormState,
} from "@/app/actions/trade-state";
import { userFacingMessage } from "@/lib/core/domain/shared/error-copy";
import { Button, buttonClasses } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CheckCircleIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { Confetti } from "@/components/ui/confetti";
import { LivePriceChip } from "./live-price-chip";
import { SlippageChip } from "./slippage-info";
import { useSlippageQuote } from "@/lib/client/use-slippage-quote";
import { useTradePreferences } from "@/lib/client/use-trade-preferences";
import { Keypad } from "./keypad";
import { toPersianDigits } from "@/lib/utils/digits";
import {
  formatCoinAmount,
  formatIrt,
  formatSlippagePercent,
} from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** Round a derived coin amount to 6 significant digits for display. */
function roundCoin(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Number(amount.toPrecision(6));
}

/**
 * Like {@link roundCoin} but truncated TOWARD ZERO to 6 significant figures — for
 * BALANCE-derived amounts that must never exceed the balance. `toPrecision`
 * rounds to nearest and can round UP (9,999,995 → 1.00000e7 = 10,000,000), which
 * turned «use full balance» into an over-balance amount (issue #63).
 */
function floorCoin(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const exp = Math.floor(Math.log10(amount)); // power of the leading digit
  const factor = 10 ** (5 - exp); // keep 6 significant figures
  return Math.floor(amount * factor) / factor;
}

/**
 * A number as a PLAIN (never exponential) decimal string for the entry field.
 * `String(5e-8)` is "5e-8", which the keypad/`toPersianDigits` can't handle
 * (renders «۵e-۸», corrupts on edit — issue #63); expand it to "0.00000005".
 * A value that already stringifies without an exponent keeps its shortest form.
 */
function toEntryDigits(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  const s = String(amount);
  if (!/e/i.test(s)) return s;
  return amount.toFixed(20).replace(/\.?0+$/, "");
}

/**
 * Fee-rate label «٪۶» / «٪۰٫۳۵» for the rate ACTUALLY being charged.
 *
 * This was a module constant derived from {@link FEE_RATE}, which made the
 * receipt structurally incapable of telling the truth: the backend's effective
 * rate is a runtime value that arrives on the quote, and when the two diverged
 * the sheet kept promising the constant. Production ran at 600 bps while this
 * printed «٪۰٫۳۵» — a 17x understatement on every order.
 */
function feePercentLabel(rate: number): string {
  return `٪${toPersianDigits(
    (rate * 100).toFixed(2).replace(/\.?0+$/, ""),
  ).replace(".", "٫")}`;
}

const SIDE_LABEL: Record<TradeSide, string> = { buy: "خرید", sell: "فروش" };

/** Tappable slider shortcuts (also the native tick marks). */
const SELL_PERCENT_POINTS = [10, 25, 50, 75, 100] as const;

/**
 * Fallback confirm window, used until the user's saved preference loads (and for
 * anyone who never set one). The user's own value wins — see the settings sheet.
 */
const CONFIRM_SECONDS = 30;
/** Per-device flag: the first trade earns the confetti welcome, once. */
const FIRST_TRADE_KEY = "nakhoda_has_traded";

/**
 * An order that has left the user's hands but has no receipt yet.
 *
 * `submitting` starts the INSTANT the user confirms — before the server has
 * answered anything. That is the point: a MARKET order settles synchronously
 * against a venue, so «waiting for the response» meant holding the user on a
 * confirm button through a whole venue round-trip. Their order is placed; the
 * outcome finds them (this sheet, the success sheet, or a toast) whether they
 * stay on this screen or not.
 *
 * `resolving` is the 202-accepted poll; `resting` is an order left open.
 */
interface Submission {
  phase: "submitting" | "resolving" | "resting";
  /** Known from `resolving` onward; `null` while the submit is still in flight. */
  orderId: string | null;
  orderType: OrderType;
}

/**
 * Failures that mean «the price moved, confirm again» rather than «your order
 * was refused». All of them are momentary and all of them are fixed by the same
 * gesture, so the confirm sheet reopens with the amounts intact and its CTA
 * turns into «تلاش دوباره» (the idempotency key is reused, so the retry can
 * only ever replay or place once).
 */
const RETRYABLE_PRICE_CODES = [
  ...PRICE_UNAVAILABLE_CODES,
  "PRICE_STALE",
  "PRICE_OUT_OF_TOLERANCE",
  "QUOTE_EXPIRED",
  "QUOTE_MISMATCH",
] as const;

/**
 * Trade screen (Moonshot-style): a side toggle and a Toman (or coin) amount
 * entered on a keypad with live conversion, then an inline confirm → server
 * action. Orders are MARKET-only and settle synchronously today (the success
 * receipt). The 202-accepted path stays wired — once async settlement is on, a
 * market order is ACCEPTED and rests, so the screen enters a pending state and
 * polls it to completion (or hands off to the open-orders list). Server-side
 * validation is authoritative; the client checks only mirror it for instant
 * feedback.
 */
export function TradeScreen({
  context,
  initialSide,
}: {
  context: TradeContext;
  initialSide: TradeSide;
}) {
  const { coin, availableIrt, availableCoin, limits, defaultMinIrt } = context;
  // Ticker label to show the user (GRAM alias when set); the canonical
  // `coin.symbol` stays the identifier for the order/routes/keys.
  const displaySymbol = coinDisplaySymbol(coin);
  // The coin's REST price is a nullable decimal string; the client-side amount
  // mirror needs a number. Parse once (0 when unavailable — a bridge only:
  // conversions then collapse to a non-finite value that the formatters render
  // as «—», so no fabricated figure is ever shown). Every DISPLAY of the price
  // itself uses the raw `coin.priceIrt` so an unavailable price shows «—», not 0.
  const parsedUnitPrice = parsePrice(coin.priceIrt);
  // A null/unparseable price is UNAVAILABLE — it must NEVER drive a preview (a
  // division by 0 that renders a fabricated «۰» coin amount) and must never let a
  // buy/sell reach the server (issue #60). The CTA is disabled and derived
  // amounts render «—» while this is false.
  const priceAvailable = parsedUnitPrice !== null;
  const unitPriceIrt = parsedUnitPrice ?? 0;
  // No holdings of this coin → selling is impossible, so the sell button never
  // appears and the side is pinned to buy (even if arrived at with ?side=sell).
  const canSell = availableCoin > 0;
  const [side, setSide] = useState<TradeSide>(canSell ? initialSide : "buy");
  // Entry mode (issue #69): the big number is Toman OR coin units; `digits`
  // holds the raw entry in the ACTIVE unit ("." allowed only in coin mode).
  const [unit, setUnit] = useState<"irt" | "coin">("irt");
  const [digits, setDigits] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CONFIRM_SECONDS);
  // One idempotency key per user INTENT (issue #55): minted when the confirm
  // sheet opens, threaded through the action into the trade adapter, and REUSED
  // across the sheet's deliberate retries (price-unavailable «تلاش دوباره», a
  // resend after a lost response). A new «ادامه» tap mints a fresh key.
  const [idempotencyKey, setIdempotencyKey] = useState("");
  // Fresh price re-fetched when the confirm sheet opens (issue #58): the
  // mount-time `coin.priceIrt` can be arbitrarily stale by the time the user
  // confirms. `null` until it arrives (or when the refresh fails / the price is
  // unavailable) — the preview then falls back to the mount price.
  const [confirmPrice, setConfirmPrice] = useState<number | null>(null);
  // The user's saved trade preferences. `confirmSeconds` sets how long the
  // confirm sheet stays valid; `slippageBps` is submitted with the order and
  // OVERRIDES the coin's configured tolerance.
  const preferences = useTradePreferences();
  const confirmSeconds = preferences.confirmSeconds;
  const [celebrate, setCelebrate] = useState(false);
  const [ackedOrderId, setAckedOrderId] = useState<string | null>(null);
  // The order in flight — from the moment the user confirms until a receipt (or
  // a toast) replaces it. Separate from the synchronous `success` state below.
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [resolvedOrder, setResolvedOrder] = useState<PlacedOrder | null>(null);
  // Snapshot of the just-submitted order, used to build the receipt if a polled
  // order settles (the poll result carries status, not the display fields).
  const snapshotRef = useRef<PlacedOrder | null>(null);
  const [state, formAction, pending] = useActionState<TradeFormState, FormData>(
    placeTradeOrder,
    { status: "idle" },
  );
  const { toast } = useToast();

  // The just-placed order (synchronous 200 SETTLED) OR one resolved from a poll;
  // either drives the success receipt.
  const settledOrder = state.status === "success" ? state.order : null;
  const displayOrder = settledOrder ?? resolvedOrder;
  const successOpen = displayOrder !== null && displayOrder.id !== ackedOrderId;
  // A backend idempotency replay: the same intent was already placed (issue #55).
  // The receipt says «already placed» instead of celebrating a second fill.
  const alreadyPlaced = state.status === "success" && state.duplicate === true;

  // The price moved (or momentarily vanished) under the order: a backend state,
  // not a bad order. It gets a «try again» toast instead of a failure, and the
  // confirm sheet reopens with the same amounts so «تلاش دوباره» re-submits.
  const priceMoved =
    state.status === "error" &&
    (RETRYABLE_PRICE_CODES as readonly string[]).includes(state.code ?? "");
  // A submit whose response never arrived. NOT a failure — the order may have
  // executed — so it gets its own sheet telling the user where to look, never a
  // «ناموفق» toast that invites a duplicate order.
  const submitUnconfirmed =
    state.status === "error" && state.code === "SUBMIT_UNCONFIRMED";

  // The confirm sheet is only valid for a short window; tick it down while open
  // (paused during submission) and auto-close when it runs out.
  useEffect(() => {
    if (!confirming || pending || secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [confirming, pending, secondsLeft]);

  useEffect(() => {
    if (confirming && !pending && secondsLeft <= 0) {
      const id = requestAnimationFrame(() => setConfirming(false));
      return () => cancelAnimationFrame(id);
    }
  }, [confirming, pending, secondsLeft]);

  // Re-fetch the live price when the confirm sheet OPENS (issue #58) so the
  // preview and the «۳۰ ثانیه معتبر» window are anchored to a fresh price, not
  // the possibly-stale mount value. On success, recompute (via `confirmPrice`)
  // and restart the validity countdown from this fetch; on failure keep the
  // mount price (the server re-prices authoritatively at submit either way).
  useEffect(() => {
    if (!confirming) {
      // Defer the reset out of the effect body to avoid a cascading render
      // (same pattern as the countdown/accepted effects above/below).
      const id = requestAnimationFrame(() => setConfirmPrice(null));
      return () => cancelAnimationFrame(id);
    }
    let cancelled = false;
    fetch(`/api/trade/${encodeURIComponent(coin.symbol)}`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("stale"))))
      .then((body: { context?: { coin?: { priceIrt?: PriceValue } } }) => {
        if (cancelled) return;
        setConfirmPrice(parsePrice(body.context?.coin?.priceIrt));
        // Anchor the validity window to THIS fresh price.
        setSecondsLeft(confirmSeconds);
      })
      .catch(() => {
        /* keep the mount price; the countdown keeps running from sheet open */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming, coin.symbol]);

  // A 202 ACCEPTED submit: leave the confirm sheet, enter the pending state, and
  // poll the order to a terminal status (or a resting hand-off). Keyed on the
  // action `state` (a fresh object each submit) so each acceptance polls once.
  useEffect(() => {
    if (state.status !== "accepted") return;
    const { orderId, orderType: ot } = state;
    let cancelled = false;
    // Defer the initial state swap out of the effect body (avoids a cascading
    // render); the poll's own setStates run after an await, so they're fine.
    const raf = requestAnimationFrame(() => {
      setConfirming(false);
      setSubmission({ phase: "resolving", orderId, orderType: ot });
    });

    (async () => {
      const res = await resolveOrder(orderId, ot);
      if (cancelled) return;

      if (res.status === "SETTLED") {
        // Build the receipt from the submit snapshot + the resolved id.
        if (snapshotRef.current) {
          setResolvedOrder({ ...snapshotRef.current, id: orderId });
        }
        setSubmission(null);
        return;
      }
      if (res.status === "REJECTED") {
        setSubmission(null);
        toast({
          variant: "error",
          title: "سفارش انجام نشد",
          description: "سفارش شما رد شد. دوباره تلاش کنید.",
        });
        return;
      }
      if (res.status === "CANCELLED") {
        setSubmission(null);
        toast({ variant: "info", title: "سفارش لغو شد" });
        return;
      }
      if (res.status === "error") {
        // The order is placed and safe in the open list — only OUR read of it
        // failed, which is not something the user needs the details of. Hand
        // them off to where the truth is instead of describing our plumbing.
        setSubmission((s) => (s ? { ...s, phase: "resting" } : s));
        toast({
          variant: "info",
          title: "وضعیت سفارش در دسترس نیست",
          description:
            "سفارش شما ثبت شده است؛ آن را در «سفارش‌های باز» ببینید.",
        });
        return;
      }
      // TIMEOUT — still resting. Not an error: the order is safe in the open
      // list. Leave the pending sheet in its "resting" state to hand off there.
      setSubmission((s) => (s ? { ...s, phase: "resting" } : s));
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // When a receipt appears (synchronous or polled): swap the sheets, and — once,
  // on this device's first trade — arm the confetti. Keyed on the order id so it
  // fires per order.
  useEffect(() => {
    if (!displayOrder) return;
    const id = requestAnimationFrame(() => {
      setConfirming(false);
      setSubmission(null);
      // A duplicate replay isn't a new trade — don't spend the first-trade
      // confetti on it (issue #55).
      if (!alreadyPlaced && !localStorage.getItem(FIRST_TRADE_KEY)) {
        localStorage.setItem(FIRST_TRADE_KEY, "1");
        setCelebrate(true);
      }
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOrder?.id]);

  // Every action error surfaces as a toast — never inline text in the confirm
  // sheet. Fired once per action return (`state` is a fresh object each submit,
  // so keying the effect on it guards against duplicate toasts on re-render).
  //
  // The DESCRIPTION never comes from the raw error. `userFacingMessage` decides
  // it from the stable `code`, so an English backend string can't reach the
  // toast and an internal fault reads as one plain Persian sentence rather than
  // leaking «CONCURRENT_MODIFICATION» at someone trying to sell a coin.
  useEffect(() => {
    if (state.status !== "error") return;
    // An unconfirmed submit has its own sheet (below) — a toast that says
    // «انجام نشد» would be a claim we cannot make, and the user would act on it
    // by placing the order a second time.
    if (submitUnconfirmed) {
      const id = requestAnimationFrame(() => {
        setConfirming(false);
        setSubmission({
          phase: "resting",
          orderId: null,
          orderType: "MARKET",
        });
      });
      return () => cancelAnimationFrame(id);
    }

    toast({
      variant: "error",
      title: priceMoved ? "قیمت بازار تغییر کرد" : "ثبت سفارش انجام نشد",
      description: userFacingMessage(state.code, state.message),
    });

    const id = requestAnimationFrame(() => {
      setSubmission(null);
      setSecondsLeft(confirmSeconds);
      // A moved price is retryable with the SAME intent, so bring the confirm
      // sheet back with the amounts intact instead of making the user rebuild
      // the order; the idempotency key is unchanged, so a retry can only ever
      // replay or place once.
      if (priceMoved) setConfirming(true);
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Dismiss the status sheet → ready for another order (keep the form as it is).
  const startAnother = () => {
    if (displayOrder) setAckedOrderId(displayOrder.id);
    setSubmission(null);
    setResolvedOrder(null);
    setCelebrate(false);
    setConfirming(false);
    setDigits("");
  };

  const entered = Number(digits || "0");
  // A MARKET order converts the entry through the live price — the fresh
  // confirm-time price while the sheet is open (issue #58), else the mount price.
  const priceForConv =
    confirming && confirmPrice !== null ? confirmPrice : unitPriceIrt;
  // Coin entry converts to Toman at the conversion price; the order (and every
  // guard and fee) stays Toman-denominated.
  const amountIrt =
    unit === "irt" ? entered : Math.round(entered * priceForConv);
  const maxIrt =
    side === "buy" ? availableIrt : Math.floor(availableCoin * priceForConv);
  // Selling the WHOLE position (issue #54): the entry covers the entire holding,
  // however the user got there — the balance chip, the ٪۱۰۰ shortcut, the
  // slider, or simply typing it.
  //
  // This is not cosmetic. Sized from the client, the order is derived from a
  // page-load price, so drift leaves DUST behind on every «فروش همه»; sized by
  // the backend from the ledger it is exact. And it carries the minimum-order
  // waiver — without which a holding that has fallen below the floor can never
  // be sold at all, because nobody tops up a position they are trying to exit.
  // The upper edge is bounded: typing ten times the holding is an OVER-sell that
  // must still say «موجودی کافی نیست», not quietly become «sell everything». The
  // 0.5% band is the same rounding allowance PlaceOrderUseCase clamps with.
  const sellingAll =
    side === "sell" &&
    availableCoin > 0 &&
    maxIrt > 0 &&
    amountIrt >= maxIrt &&
    amountIrt <= maxIrt * 1.005;
  // Sell slider (percent of holdings). Derived from the entry, so typing on
  // the keypad moves the slider too; sliding writes the entry in the active
  // unit. Sell-only — «چند درصد بفروشم؟» has no buy-side meaning.
  const sellPercent =
    maxIrt > 0 ? Math.min(100, Math.round((amountIrt / maxIrt) * 100)) : 0;
  const applySellPercent = (percent: number) => {
    if (percent <= 0) {
      setDigits("");
      return;
    }
    if (unit === "irt") {
      setDigits(String(Math.floor((maxIrt * percent) / 100)));
    } else {
      // Toward-zero + non-exponential (issue #63): a nearest-round could exceed
      // the holding, and `String(availableCoin)` can be scientific notation.
      setDigits(
        toEntryDigits(
          percent === 100
            ? availableCoin
            : floorCoin((availableCoin * percent) / 100),
        ),
      );
    }
  };

  // Per-token bounds (GET /v1/trade/limits) for the active side; the global
  // floor is the fallback min, and the API max (when set) is a hard cap on top
  // of the balance cap.
  const minIrt = minOrderIrt(limits, side, defaultMinIrt);
  const apiMaxIrt = maxOrderIrt(limits, side);
  // Buying beyond the Toman balance isn't a dead end — it's a nudge to top up
  // and come back with more to spend, so the CTA turns into a deposit link.
  // Only when the price is available: an unavailable price shows the disabled
  // «ادامه» CTA (the block is the price, not the balance), never a deposit nudge.
  const needsDeposit = priceAvailable && side === "buy" && amountIrt > maxIrt;
  const error = !priceAvailable
    ? "قیمت لحظه‌ای در دسترس نیست. کمی بعد دوباره تلاش کنید."
    : side === "sell" && availableCoin <= 0
      ? "از این رمزارز موجودی ندارید."
      : // The floor never blocks a full sell — see `sellingAll`.
        !sellingAll && amountIrt > 0 && amountIrt < minIrt
        ? `کمینه هر سفارش ${formatIrt(minIrt)} است.`
        : apiMaxIrt !== null && amountIrt > apiMaxIrt
          ? `بیشینه هر سفارش ${formatIrt(apiMaxIrt)} است.`
          : needsDeposit
            ? "موجودی کافی نیست. برای خرید، حساب خود را شارژ کنید."
            : !sellingAll && amountIrt > maxIrt
              ? "موجودی شما کافی نیست."
              : null;
  // A MARKET order can't be priced (or placed) without a live price, so an
  // unavailable price is never valid — this disables the CTA client-side (issue
  // #60), mirroring the server's PRICE_UNAVAILABLE guard.
  //
  // A full sell clears the minimum and the balance cap by definition: the size
  // IS the balance, and the server re-derives it. Only the maximum still bites
  // (exempting that would let a sell-all bypass a risk limit, as on the server).
  const valid =
    priceAvailable &&
    (sellingAll ? true : amountIrt >= minIrt && amountIrt <= maxIrt) &&
    (apiMaxIrt === null || amountIrt <= apiMaxIrt);

  // Why the floor isn't stopping them. Without this, a holding worth less than
  // the minimum reads as a screen that has simply stopped enforcing its own rule
  // — and users who have seen «کمینه هر سفارش» before will not trust the CTA.
  const note =
    error === null && sellingAll && amountIrt < minIrt
      ? "فروش کل دارایی از کمینه سفارش معاف است."
      : null;

  // Unit price shown on the confirm receipt: the fresh confirm-time price (issue
  // #58) while the sheet is open, else the mount price. Kept nullable so an
  // unavailable price renders «—», never a fabricated 0.
  const receiptPriceIrt: PriceValue =
    confirming && confirmPrice !== null ? confirmPrice : coin.priceIrt;

  // Expected price impact for THIS order, priced by the backend once the amount
  // settles. Only quoted for an order the backend would accept — an invalid
  // amount would just be refused, and a figure for it would mean nothing.
  const {
    bps: slippageBps,
    feeRateBps,
    quoteId,
  } = useSlippageQuote({
    symbol: coin.symbol,
    side,
    amountIrt,
    enabled: valid && amountIrt > 0,
  });

  // The rate the backend will actually charge, from the same quote. FEE_RATE is
  // only a fallback for before the quote lands — never the source of truth.
  const effectiveFeeRate = feeRateBps !== null ? feeRateBps / 10_000 : FEE_RATE;

  // The server-minted quote this order will COMMIT to (issue #59): the fill is
  // priced at the figure the sheet showed, and the house absorbs any move inside
  // its TTL, instead of the order riding the client price band where an ordinary
  // mid-confirm tick comes back as PRICE_OUT_OF_TOLERANCE.
  //
  // Never on a «فروش همه»: the backend re-sizes that from the ledger, and a
  // quote may only price the exact (symbol, side, amount) it was minted for — so
  // pinning one there is a guaranteed QUOTE_MISMATCH.
  const committedQuoteId = sellingAll ? null : quoteId;

  // Expected slippage against the tolerance the user actually set. Above it the
  // order does not get filled at a worse price — it gets REFUSED — so this is a
  // fix-it-now warning, shown while the amount can still be changed, rather than
  // a rejection to decode after the fact.
  const toleranceBps = preferences.slippageBps;
  const slippageOverTolerance =
    slippageBps !== null && toleranceBps !== null && slippageBps > toleranceBps;

  // Mirror of the server-side fee math (PlaceOrderUseCase is authoritative):
  // buyers pay the fee out of the entered amount, sellers out of the proceeds.
  // Computed here, below the quote, so the preview and the receipt agree with
  // what is charged rather than with a compile-time constant.
  const feeIrt = Math.round(amountIrt * effectiveFeeRate);
  // `null` (not 0) when there's no usable price, so the derived amount renders
  // «—» rather than a fabricated «۰» and never feeds a divide-by-zero preview
  // into the confirm sheet (issue #60).
  const amountCoin =
    priceForConv > 0
      ? roundCoin((amountIrt - (side === "buy" ? feeIrt : 0)) / priceForConv)
      : null;

  // Confirm-receipt lines. The slippage row appears only when the backend could
  // actually price one — never as a blank or a fabricated zero.
  const receiptRows: Array<{ key: string; label: ReactNode; value: string }> = [
    { key: "type", label: "نوع سفارش", value: `${SIDE_LABEL[side]} بازار` },
    {
      key: "amount",
      label: "مقدار",
      value: `${formatCoinAmount(amountCoin)} ${displaySymbol}`,
    },
    { key: "price", label: "قیمت واحد", value: formatIrt(receiptPriceIrt) },
    {
      key: "fee",
      label: `کارمزد (${feePercentLabel(effectiveFeeRate)})`,
      value: formatIrt(feeIrt),
    },
    ...(toleranceBps !== null
      ? [
          {
            key: "slippage-tolerance",
            label: "حداکثر لغزش مجاز",
            value: formatSlippagePercent(toleranceBps),
          },
        ]
      : []),
    side === "sell"
      ? {
          key: "total",
          // A full sell is sized by the server from the ledger at fill time, so
          // this figure is an estimate of the proceeds and saying otherwise
          // would over-promise by whatever the price moves in between.
          label: sellingAll ? "دریافتی تقریبی" : "دریافتی خالص",
          value: formatIrt(amountIrt - feeIrt),
        }
      : { key: "total", label: "مجموع پرداختی", value: formatIrt(amountIrt) },
  ];

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      {/* Side toggle — the first decision on the screen, so it sits at the top,
          above the price it reframes. Sell only when the user holds this coin
          (with none, the screen is buy-only and the toggle would be a dead end). */}
      {canSell ? (
        <div className="mx-auto grid w-fit grid-cols-2 gap-1 rounded-full bg-surface p-1">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              aria-pressed={s === side}
              className={cn(
                "rounded-full px-6 py-1.5 text-[13px] font-bold transition-colors",
                s === side
                  ? "bg-brand text-white"
                  : "text-muted hover:text-ink",
              )}
            >
              {SIDE_LABEL[s]}
            </button>
          ))}
        </div>
      ) : null}

      {/* Live market price — centered, green, pulsing (display only). */}
      <LivePriceChip coinId={coin.id} basePrice={coin.priceIrt} />

      {/* Expected price impact for the amount being entered, with the ⓘ that
          explains what slippage is. Keeps a reserved line so it can appear and
          clear without moving the amount below it. */}
      <SlippageChip bps={slippageBps} />

      {/* Balance — no separate max button; tapping the balance fills the
          whole available amount into the entry. */}
      <button
        type="button"
        onClick={() =>
          setDigits(
            unit === "irt"
              ? String(maxIrt)
              : // Toward-zero + non-exponential (issue #63): a nearest-round of
                // the max-buy amount could overshoot the balance, and
                // `String(availableCoin)` can be scientific notation.
                toEntryDigits(
                  side === "sell"
                    ? availableCoin
                    : floorCoin(maxIrt / priceForConv),
                ),
          )
        }
        disabled={maxIrt <= 0}
        aria-label="استفاده از کل موجودی"
        className="mx-auto text-[14px] text-muted transition-colors hover:text-ink disabled:opacity-50"
      >
        موجودی:{" "}
        <span className="font-bold text-ink">
          {side === "buy"
            ? formatIrt(availableIrt)
            : `${formatCoinAmount(roundCoin(availableCoin))} ${displaySymbol}`}
        </span>
      </button>

      {/* Amount — big number in the active unit; tap ⇅ to swap (issue #69) */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
        {unit === "irt" ? (
          <span
            className={cn(
              "text-[34px] font-extrabold",
              amountIrt > 0 ? "text-ink" : "text-placeholder",
            )}
          >
            {formatIrt(amountIrt)}
          </span>
        ) : (
          <span
            dir="ltr"
            className={cn(
              "text-[34px] font-extrabold",
              entered > 0 ? "text-ink" : "text-placeholder",
            )}
          >
            {digits ? toPersianDigits(digits).replace(".", "٫") : "۰"}{" "}
            {displaySymbol}
          </span>
        )}
        {/* Equivalent value — always shown as plain text so you see the amount
            AND what it's worth in the other unit; tap ⇅ to swap the entry unit. */}
        <div className="flex items-center gap-2 text-muted">
          <span dir="ltr" className="text-[15px]">
            {unit === "irt"
              ? `≈ ${formatCoinAmount(amountCoin)} ${displaySymbol}`
              : `≈ ${formatIrt(priceAvailable ? amountIrt : null)}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setUnit(unit === "irt" ? "coin" : "irt");
              setDigits("");
            }}
            aria-label={
              unit === "irt"
                ? "ورود مقدار بر حسب رمزارز"
                : "ورود مقدار به تومان"
            }
            className="flex size-7 items-center justify-center rounded-full bg-surface transition-colors hover:text-ink"
          >
            <span aria-hidden>⇅</span>
          </button>
        </div>
        {/* Always mounted with a reserved line so showing/clearing an error
            doesn't shift the centred amount and jump the layout. */}
        <p
          role="alert"
          className={cn(
            "min-h-[1.25rem] text-[13px] font-bold",
            error ? "text-loss" : "text-muted",
          )}
        >
          {error ?? note}
        </p>
      </div>

      {/* Sell slider + keypad read as one input cluster near the thumb —
          compact, centered, no gap between the parts. */}
      <div className="flex flex-col gap-2">
        {/* Kept mounted (not toggled) so switching buy⇄sell doesn't change the
            cluster height and jump the layout — just hidden on buy. */}
        {canSell ? (
          <div
            className={cn(
              "flex flex-col gap-1.5",
              side !== "sell" && "invisible",
            )}
            aria-hidden={side !== "sell"}
          >
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted">چند درصد از دارایی؟</span>
              <span className="font-bold text-brand">
                ٪{toPersianDigits(sellPercent)}
              </span>
            </div>
            {/* dir=ltr: the slider grows left→right (۰ چپ، ۱۰۰ راست) like a
                progress bar, not mirrored by the RTL page. 5% drag steps; the
                named points below are tappable shortcuts + native ticks.
                --pct drives the WebKit/Blink track fill. */}
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              list="sell-percent-points"
              value={sellPercent}
              onChange={(e) => applySellPercent(Number(e.target.value))}
              aria-label="درصد فروش از دارایی"
              dir="ltr"
              style={{ "--pct": `${sellPercent}%` } as CSSProperties}
              className="range-brand"
            />
            <datalist id="sell-percent-points">
              {SELL_PERCENT_POINTS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <div dir="ltr" className="relative h-5">
              {SELL_PERCENT_POINTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => applySellPercent(p)}
                  style={{ left: `${p}%` }}
                  className={cn(
                    "absolute top-0 px-1 text-[11px] transition-colors",
                    p === 100 ? "-translate-x-full" : "-translate-x-1/2",
                    sellPercent === p
                      ? "font-bold text-brand"
                      : "text-placeholder hover:text-muted",
                  )}
                >
                  ٪{toPersianDigits(p)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <Keypad
          decimal={unit === "coin"}
          onDigit={(d) =>
            setDigits((cur) => {
              if (cur.length >= 12) return cur;
              if (d === ".") {
                // one separator, coin mode only; leading "." becomes "0."
                if (unit !== "coin" || cur.includes(".")) return cur;
                return cur === "" ? "0." : cur + ".";
              }
              if (cur === "" && d === "0" && unit === "irt") return cur;
              if (cur === "0" && d !== "." && unit === "coin") return cur;
              return cur + d;
            })
          }
          onBackspace={() => setDigits((cur) => cur.slice(0, -1))}
        />
      </div>

      {/* Track resting orders (limit orders live here until they trigger). */}
      <Link
        href="/orders"
        className="mx-auto text-[13px] font-bold text-brand transition-colors hover:text-ink"
      >
        سفارش‌های باز
      </Link>

      {needsDeposit ? (
        <Link
          href="/wallet/deposit"
          className={buttonClasses({ size: "xl", fullWidth: true })}
        >
          افزایش موجودی
        </Link>
      ) : (
        <Button
          type="button"
          size="xl"
          fullWidth
          disabled={!valid}
          onClick={() => {
            // One idempotency key per intent (issue #55) — minted here, reused
            // across the confirm sheet's retries; a new «ادامه» mints a new one.
            setIdempotencyKey(crypto.randomUUID());
            setSecondsLeft(confirmSeconds);
            setConfirming(true);
          }}
        >
          ادامه
        </Button>
      )}

      {/* Confirm as a bottom sheet (no page change); valid for CONFIRM_SECONDS
          then it auto-closes. */}
      <Sheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`تأیید ${SIDE_LABEL[side]} ${coin.name}`}
        manageBack={false}
      >
        <form
          action={formAction}
          onSubmit={() => {
            // Snapshot the order so a polled (202) settlement can build the
            // receipt from these values plus the resolved id.
            snapshotRef.current = {
              id: "",
              side,
              coinId: coin.id,
              symbol: coin.symbol,
              name: coin.name,
              // Non-null here: the CTA that opened this sheet requires a price.
              amountCoin: amountCoin ?? 0,
              totalIrt: amountIrt,
              feeIrt,
              priceIrt: priceForConv,
            };
            // HAND THE ORDER OFF NOW. A MARKET order settles synchronously
            // against a venue, so waiting for the response meant pinning the
            // user to a spinning confirm button for the whole round-trip — and
            // nothing about that wait changed the outcome. The order is placed
            // the moment they confirm; the sheet below says so, and the receipt
            // (or the toast) reaches them wherever they are.
            //
            // Deferred a frame so React finishes dispatching this submit before
            // the sheet starts unmounting the form — same pattern as the
            // countdown/accepted effects above.
            requestAnimationFrame(() => {
              setConfirming(false);
              setSubmission({
                phase: "submitting",
                orderId: null,
                orderType: "MARKET",
              });
            });
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="coinId" value={coin.id} />
          <input type="hidden" name="side" value={side} />
          <input type="hidden" name="amountIrt" value={amountIrt} />
          <input type="hidden" name="orderType" value="MARKET" />
          {/* One key per intent, reused on every retry of THIS sheet (issue #55). */}
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          {/* «فروش همه» (issue #54): the backend sizes from the ledger and waives
              the minimum, so the position empties completely and a below-minimum
              holding stays sellable. */}
          {sellingAll ? <input type="hidden" name="sellAll" value="1" /> : null}
          {/* The server-minted quote the sheet priced this order from (issue #59)
              — the fill honours it, so the house carries any move inside its TTL. */}
          {committedQuoteId ? (
            <input type="hidden" name="quoteId" value={committedQuoteId} />
          ) : null}
          {/* The user's own tolerance, when they set one. Absent ⇒ the backend
              resolves the coin's own value. */}
          {toleranceBps !== null ? (
            <input type="hidden" name="slippageBps" value={toleranceBps} />
          ) : null}

          <dl className="flex flex-col divide-y divide-line rounded-card border border-line">
            {receiptRows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between p-4"
              >
                <dt className="text-[15px] text-muted">{row.label}</dt>
                <dd className="text-[15px] font-bold text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>

          {/* The tolerance the user set is a REFUSAL threshold, not a price cap:
              above it the order comes back rejected. Say so here, where the
              amount can still be changed, instead of after the fact. */}
          {slippageOverTolerance ? (
            <p
              role="alert"
              className="rounded-card bg-loss-soft p-3 text-center text-[13px] leading-6 text-loss"
            >
              لغزش تخمینی این سفارش ({formatSlippagePercent(slippageBps)}) از
              حداکثر مجاز شما ({formatSlippagePercent(toleranceBps)}) بیشتر است
              و احتمالاً انجام نمی‌شود. مقدار کمتری را امتحان کنید یا حد لغزش را
              در تنظیمات معامله بالا ببرید.
            </p>
          ) : null}

          <p className="text-center text-[12px] text-placeholder">
            این تأیید تا {toPersianDigits(secondsLeft)} ثانیه دیگر معتبر است
          </p>

          <div className="flex flex-col gap-2">
            <Button type="submit" size="xl" fullWidth disabled={pending}>
              {pending
                ? "در حال ثبت سفارش…"
                : priceMoved
                  ? "تلاش دوباره"
                  : `تأیید ${SIDE_LABEL[side]}`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              fullWidth
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              ویرایش سفارش
            </Button>
          </div>
        </form>
      </Sheet>

      {/* Submission sheet. It opens the INSTANT the user confirms — the order is
          theirs to walk away from, not something to be held on a spinner for.
          «resting» means the order is safely open (a limit order, a timed-out
          poll, or a submit whose answer we never got) and hands off to the
          open-orders list. Dismissable throughout: the receipt or the toast
          still finds the user afterwards. */}
      <Sheet
        open={submission !== null && !successOpen}
        onClose={() => setSubmission(null)}
        title={
          submitUnconfirmed
            ? // We do NOT know this order was placed — claiming so would be as
              // wrong as claiming it failed.
              "وضعیت سفارش نامشخص است"
            : submission?.phase === "resting"
              ? "سفارش شما ثبت شد"
              : submission?.orderType === "LIMIT"
                ? "در حال ثبت سفارش حد"
                : "سفارش شما ارسال شد"
        }
        manageBack={false}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          {/* No mark at all when the outcome is unknown: a tick would claim the
              order landed, a spinner that we are still watching it. Neither is
              true — the response is simply gone. */}
          {submitUnconfirmed ? null : submission?.phase === "resting" ? (
            <CheckCircleIcon size={52} className="text-brand" />
          ) : (
            <span
              className="size-10 animate-spin rounded-full border-[3px] border-line border-t-brand"
              aria-hidden
            />
          )}
          <p className="text-[15px] leading-7 text-muted">
            {submitUnconfirmed
              ? "سفارش شما ارسال شد اما پاسخ سامانه دریافت نشد. پیش از ثبت دوباره، «سفارش‌های باز» و «دارایی» را بررسی کنید."
              : submission?.phase === "resting"
                ? "سفارش شما ثبت شد و تا رسیدن به شرایط اجرا باز می‌ماند. می‌توانید آن را در «سفارش‌های باز» ببینید یا لغو کنید."
                : "سفارش شما ثبت شد و در حال انجام است. لازم نیست منتظر بمانید — نتیجه را به شما نشان می‌دهیم."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/orders"
            className={buttonClasses({ size: "xl", fullWidth: true })}
          >
            مشاهده سفارش‌های باز
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => {
              setSubmission(null);
              if (submission?.phase === "resting") setDigits("");
            }}
          >
            بستن
          </Button>
        </div>
      </Sheet>

      {/* Status sheet — the order is placed; the user can track it in the
          wallet or dismiss and place another. First trade rains confetti. */}
      {successOpen && celebrate ? <Confetti /> : null}
      <Sheet
        open={successOpen}
        onClose={startAnother}
        title={
          celebrate
            ? "اولین معامله ثبت شد"
            : alreadyPlaced
              ? "این سفارش قبلاً ثبت شده بود"
              : "سفارش شما ثبت شد"
        }
        manageBack={false}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircleIcon size={56} className="text-brand" />
          {celebrate ? (
            <p className="text-[16px] font-bold text-brand">
              خوش آمدید، ناخدای جوان
            </p>
          ) : null}
          {displayOrder ? (
            <p className="text-[15px] leading-7 text-muted">
              {formatCoinAmount(roundCoin(displayOrder.amountCoin))}{" "}
              {displaySymbol} به ارزش {formatIrt(displayOrder.totalIrt)}
            </p>
          ) : null}
          <p className="text-[14px] text-placeholder">
            {alreadyPlaced
              ? "این سفارش پیش‌تر ثبت شده و دوباره اجرا نشد. می‌توانید آن را در «دارایی» دنبال کنید."
              : "سفارش ثبت شد و در حال انجام است. می‌توانید آن را در «دارایی» دنبال کنید."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/wallet"
            className={buttonClasses({ size: "xl", fullWidth: true })}
          >
            پیگیری در دارایی
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={startAnother}
          >
            سفارش جدید
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
