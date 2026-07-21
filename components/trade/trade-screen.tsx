"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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
import { parsePrice } from "@/lib/core/domain/market/price";
import { placeTradeOrder, resolveOrder } from "@/app/actions/trade";
import {
  PRICE_UNAVAILABLE_CODES,
  type TradeFormState,
} from "@/app/actions/trade-state";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { CheckCircleIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { Confetti } from "@/components/ui/confetti";
import { LivePriceChip } from "./live-price-chip";
import { Keypad } from "./keypad";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { formatCoinAmount, formatIrt } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** Round a derived coin amount to 6 significant digits for display. */
function roundCoin(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Number(amount.toPrecision(6));
}

/** Group an english-digit string with Persian thousands separators. */
function groupFa(digits: string): string {
  return toPersianDigits(digits.replace(/\B(?=(\d{3})+(?!\d))/g, "٬"));
}

const SIDE_LABEL: Record<TradeSide, string> = { buy: "خرید", sell: "فروش" };
const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  MARKET: "بازار",
  LIMIT: "حد",
};

/** Tappable slider shortcuts (also the native tick marks). */
const SELL_PERCENT_POINTS = [10, 25, 50, 75, 100] as const;

/** How long the confirm sheet stays valid before it auto-closes. */
const CONFIRM_SECONDS = 30;
/** Per-device flag: the first trade earns the confetti welcome, once. */
const FIRST_TRADE_KEY = "nakhoda_has_traded";

/** In-flight resolution of a 202-accepted order (poll → terminal / hand-off). */
interface Resolving {
  orderId: string;
  orderType: OrderType;
  /** True once the poll budget elapsed and the order is left resting. */
  resting: boolean;
}

/**
 * Trade screen (Moonshot-style): a MARKET/LIMIT toggle, a side toggle, a Toman
 * (or coin) amount entered on a keypad with live conversion, then an inline
 * confirm → server action. A MARKET order settles synchronously (the success
 * receipt); a LIMIT order — and any market order once async settlement is on —
 * is ACCEPTED and rests, so the screen enters a pending state and polls it to
 * completion (or hands off to the open-orders list). Server-side validation is
 * authoritative; the client checks only mirror it for instant feedback.
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
  const unitPriceIrt = parsePrice(coin.priceIrt) ?? 0;
  // No holdings of this coin → selling is impossible, so the sell button never
  // appears and the side is pinned to buy (even if arrived at with ?side=sell).
  const canSell = availableCoin > 0;
  const [side, setSide] = useState<TradeSide>(canSell ? initialSide : "buy");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const isLimit = orderType === "LIMIT";
  // Entry mode (issue #69): the big number is Toman OR coin units; `digits`
  // holds the raw entry in the ACTIVE unit ("." allowed only in coin mode).
  const [unit, setUnit] = useState<"irt" | "coin">("irt");
  const [digits, setDigits] = useState("");
  // LIMIT target price — whole IRT per coin, raw english digits.
  const [targetDigits, setTargetDigits] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CONFIRM_SECONDS);
  const [celebrate, setCelebrate] = useState(false);
  const [ackedOrderId, setAckedOrderId] = useState<string | null>(null);
  // A 202-accepted order being polled to completion, and the receipt it resolves
  // to (SETTLED). Separate from the synchronous `success` state below.
  const [resolving, setResolving] = useState<Resolving | null>(null);
  const [resolvedOrder, setResolvedOrder] = useState<PlacedOrder | null>(null);
  // Snapshot of the just-submitted order, used to build the receipt if a polled
  // order settles (the poll result carries status, not the display fields).
  const snapshotRef = useRef<PlacedOrder | null>(null);
  const [state, formAction, pending] = useActionState<TradeFormState, FormData>(
    placeTradeOrder,
    { status: "idle" },
  );
  const { toast } = useToast();

  // LIMIT is SPEND-committed: a BUY commits an IRT amount, a SELL commits a coin
  // amount (the backend rejects a TARGET-output limit). So in LIMIT mode the
  // entry unit is fixed by side — Toman for buy, coin for sell — and the ⇅ swap
  // is hidden. The unit is re-fixed (and the stale entry cleared) in the toggle
  // handlers below, not an effect, to avoid a cascading render.
  const selectOrderType = (next: OrderType) => {
    setOrderType(next);
    if (next === "LIMIT") {
      setUnit(side === "buy" ? "irt" : "coin");
      setDigits("");
    }
  };
  const selectSide = (next: TradeSide) => {
    setSide(next);
    if (isLimit) {
      setUnit(next === "buy" ? "irt" : "coin");
      setDigits("");
    }
  };

  // The just-placed order (synchronous 200 SETTLED) OR one resolved from a poll;
  // either drives the success receipt.
  const settledOrder = state.status === "success" ? state.order : null;
  const displayOrder = settledOrder ?? resolvedOrder;
  const successOpen = displayOrder !== null && displayOrder.id !== ackedOrderId;

  // Stale live price (HTTP 503 PRICE_UNAVAILABLE): a momentary backend state,
  // not a bad order. It gets a retry toast instead of the inline error, and the
  // confirm sheet stays open with the same amounts so «تلاش دوباره» re-submits.
  const priceUnavailable =
    state.status === "error" &&
    (PRICE_UNAVAILABLE_CODES as readonly string[]).includes(state.code ?? "");

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
      setResolving({ orderId, orderType: ot, resting: false });
    });

    (async () => {
      const res = await resolveOrder(orderId, ot);
      if (cancelled) return;

      if (res.status === "SETTLED") {
        // Build the receipt from the submit snapshot + the resolved id.
        if (snapshotRef.current) {
          setResolvedOrder({ ...snapshotRef.current, id: orderId });
        }
        setResolving(null);
        return;
      }
      if (res.status === "REJECTED") {
        setResolving(null);
        toast({
          variant: "error",
          title: "سفارش انجام نشد",
          description: "سفارش شما رد شد. دوباره تلاش کنید.",
        });
        return;
      }
      if (res.status === "CANCELLED") {
        setResolving(null);
        toast({ variant: "info", title: "سفارش لغو شد" });
        return;
      }
      if (res.status === "error") {
        setResolving(null);
        toast({
          variant: "error",
          title: "خطا در پیگیری سفارش",
          description: res.message,
        });
        return;
      }
      // TIMEOUT — still resting. Not an error: the order is safe in the open
      // list. Leave the pending sheet in its "resting" state to hand off there.
      setResolving((r) => (r ? { ...r, resting: true } : r));
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
      if (!localStorage.getItem(FIRST_TRADE_KEY)) {
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
  useEffect(() => {
    if (state.status !== "error") return;
    if (priceUnavailable) {
      toast({
        variant: "error",
        title: "قیمت لحظه‌ای در دسترس نیست",
        description: "لطفاً کمی بعد دوباره تلاش کنید.",
      });
    } else {
      toast({
        variant: "error",
        title: "خطا در ثبت سفارش",
        description: state.message || "دوباره تلاش کنید.",
      });
    }
    // Defer the timer reset out of the effect body (avoids a cascading render).
    const id = requestAnimationFrame(() => setSecondsLeft(CONFIRM_SECONDS));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Dismiss the status sheet → ready for another order (keep the form as it is).
  const startAnother = () => {
    if (displayOrder) setAckedOrderId(displayOrder.id);
    setResolvedOrder(null);
    setCelebrate(false);
    setConfirming(false);
    setDigits("");
  };

  const entered = Number(digits || "0");
  const targetPriceIrt = Number(targetDigits || "0");
  // The price the entry converts through: a LIMIT order commits at its target;
  // a MARKET order at the live price.
  const priceForConv = isLimit ? targetPriceIrt : unitPriceIrt;
  // Coin entry converts to Toman at the conversion price; the order (and every
  // guard and fee) stays Toman-denominated.
  const amountIrt =
    unit === "irt" ? entered : Math.round(entered * priceForConv);
  // Mirror of the server-side fee math (PlaceOrderUseCase is authoritative):
  // buyers pay the fee out of the entered amount, sellers out of the proceeds.
  const feeIrt = Math.round(amountIrt * FEE_RATE);
  const amountCoin = roundCoin(
    (amountIrt - (side === "buy" ? feeIrt : 0)) / priceForConv,
  );
  const maxIrt =
    side === "buy" ? availableIrt : Math.floor(availableCoin * priceForConv);
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
      setDigits(
        String(
          percent === 100
            ? availableCoin
            : roundCoin((availableCoin * percent) / 100),
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
  const needsDeposit = side === "buy" && amountIrt > maxIrt;
  const missingTarget = isLimit && targetPriceIrt <= 0;
  const error =
    side === "sell" && availableCoin <= 0
      ? "از این رمزارز موجودی ندارید."
      : missingTarget && entered > 0
        ? "قیمت هدف را وارد کنید."
        : amountIrt > 0 && amountIrt < minIrt
          ? `کمینه هر سفارش ${formatIrt(minIrt)} است.`
          : apiMaxIrt !== null && amountIrt > apiMaxIrt
            ? `بیشینه هر سفارش ${formatIrt(apiMaxIrt)} است.`
            : needsDeposit
              ? "موجودی کافی نیست. برای خرید، حساب خود را شارژ کنید."
              : amountIrt > maxIrt
                ? "موجودی شما کافی نیست."
                : null;
  const valid =
    amountIrt >= minIrt &&
    amountIrt <= maxIrt &&
    (apiMaxIrt === null || amountIrt <= apiMaxIrt) &&
    (!isLimit || targetPriceIrt > 0);

  // Unit price shown on the confirm receipt: the target for LIMIT, live for MARKET.
  const receiptPriceIrt = isLimit ? targetPriceIrt : (coin.priceIrt ?? 0);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      {/* Live market price — centered, green, pulsing (display only). */}
      <LivePriceChip coinId={coin.id} basePrice={coin.priceIrt} />

      {/* Order type — بازار (fill now) vs حد (rest until a target price). */}
      <div className="mx-auto grid w-fit grid-cols-2 gap-1 rounded-full bg-surface p-1">
        {(["MARKET", "LIMIT"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => selectOrderType(t)}
            aria-pressed={t === orderType}
            className={cn(
              "rounded-full px-6 py-1.5 text-[13px] font-bold transition-colors",
              t === orderType
                ? "bg-brand text-white"
                : "text-muted hover:text-ink",
            )}
          >
            {t === "MARKET" ? "بازار" : "قیمت حد"}
          </button>
        ))}
      </div>

      {/* Balance — no separate max button; tapping the balance fills the
          whole available amount into the entry. */}
      <button
        type="button"
        onClick={() =>
          setDigits(
            unit === "irt"
              ? String(maxIrt)
              : String(
                  side === "sell"
                    ? availableCoin
                    : roundCoin(maxIrt / priceForConv),
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
            AND what it's worth in the other unit. In LIMIT mode the swap (⇅) is
            hidden: the entry unit is fixed by side (SPEND-committed). */}
        <div className="flex items-center gap-2 text-muted">
          <span dir="ltr" className="text-[15px]">
            {unit === "irt"
              ? `≈ ${formatCoinAmount(amountCoin)} ${displaySymbol}`
              : `≈ ${formatIrt(amountIrt)}`}
          </span>
          {!isLimit ? (
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
          ) : null}
        </div>
        {/* Always mounted with a reserved line so showing/clearing an error
            doesn't shift the centred amount and jump the layout. */}
        <p
          role="alert"
          className="min-h-[1.25rem] text-[13px] font-bold text-loss"
        >
          {error}
        </p>
      </div>

      {/* LIMIT target price — whole Toman per coin; the order rests until the
          market reaches it. */}
      {isLimit ? (
        <Field
          name="targetPrice"
          label={`قیمت هدف (تومان به ازای هر ${displaySymbol})`}
          inputMode="numeric"
          dir="ltr"
          placeholder="۰"
          value={targetDigits ? groupFa(targetDigits) : ""}
          onChange={(e) =>
            setTargetDigits(
              toEnglishDigits(e.target.value)
                .replace(/[^\d]/g, "")
                .slice(0, 15),
            )
          }
        />
      ) : null}

      {/* Side toggle + sell slider + keypad read as one input cluster near the
          thumb — compact, centered, no gap between the parts. Sell only when
          the user holds this coin. */}
      <div className="flex flex-col gap-2">
        {canSell ? (
          <div className="mx-auto grid w-fit grid-cols-2 gap-1 rounded-full bg-surface p-1">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => selectSide(s)}
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
            setSecondsLeft(CONFIRM_SECONDS);
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
              amountCoin,
              totalIrt: amountIrt,
              feeIrt,
              priceIrt: isLimit ? targetPriceIrt : unitPriceIrt,
            };
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="coinId" value={coin.id} />
          <input type="hidden" name="side" value={side} />
          <input type="hidden" name="amountIrt" value={amountIrt} />
          <input type="hidden" name="orderType" value={orderType} />
          {isLimit ? (
            <input type="hidden" name="targetPriceIrt" value={targetPriceIrt} />
          ) : null}

          <dl className="flex flex-col divide-y divide-line rounded-card border border-line">
            {[
              [
                "نوع سفارش",
                `${SIDE_LABEL[side]} ${ORDER_TYPE_LABEL[orderType]}`,
              ],
              ["مقدار", `${formatCoinAmount(amountCoin)} ${displaySymbol}`],
              [isLimit ? "قیمت هدف" : "قیمت واحد", formatIrt(receiptPriceIrt)],
              ["کارمزد (٪۰٫۳۵)", formatIrt(feeIrt)],
              side === "sell"
                ? ["دریافتی خالص", formatIrt(amountIrt - feeIrt)]
                : ["مجموع پرداختی", formatIrt(amountIrt)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between p-4">
                <dt className="text-[15px] text-muted">{k}</dt>
                <dd className="text-[15px] font-bold text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          {isLimit ? (
            <p className="text-center text-[12px] leading-[1.8] text-muted">
              این سفارش تا رسیدن قیمت بازار به هدف شما باز می‌ماند و سپس انجام
              می‌شود.
            </p>
          ) : null}

          <p className="text-center text-[12px] text-placeholder">
            این تأیید تا {toPersianDigits(secondsLeft)} ثانیه دیگر معتبر است
          </p>

          <div className="flex flex-col gap-2">
            <Button type="submit" size="xl" fullWidth disabled={pending}>
              {pending
                ? "در حال ثبت سفارش…"
                : priceUnavailable
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

      {/* Pending sheet — a 202-accepted order being polled. While polling it
          spins; once it's clear the order is resting (limit / timed-out poll),
          it hands the user off to the open-orders list. */}
      <Sheet
        open={resolving !== null && !successOpen}
        onClose={() => setResolving(null)}
        title={
          resolving?.resting
            ? "سفارش شما ثبت شد"
            : resolving?.orderType === "LIMIT"
              ? "در حال ثبت سفارش حد"
              : "در حال نهایی‌سازی سفارش"
        }
        manageBack={false}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          {resolving?.resting ? (
            <CheckCircleIcon size={52} className="text-brand" />
          ) : (
            <span
              className="size-10 animate-spin rounded-full border-[3px] border-line border-t-brand"
              aria-hidden
            />
          )}
          <p className="text-[15px] leading-7 text-muted">
            {resolving?.resting
              ? "سفارش شما ثبت شد و تا رسیدن به شرایط اجرا باز می‌ماند. می‌توانید آن را در «سفارش‌های باز» ببینید یا لغو کنید."
              : "لطفاً کمی صبر کنید…"}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/orders"
            className={buttonClasses({ size: "xl", fullWidth: true })}
          >
            مشاهده سفارش‌های باز
          </Link>
          {resolving?.resting ? (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => {
                setResolving(null);
                setDigits("");
              }}
            >
              بستن
            </Button>
          ) : null}
        </div>
      </Sheet>

      {/* Status sheet — the order is placed; the user can track it in the
          wallet or dismiss and place another. First trade rains confetti. */}
      {successOpen && celebrate ? <Confetti /> : null}
      <Sheet
        open={successOpen}
        onClose={startAnother}
        title={celebrate ? "اولین معامله ثبت شد" : "سفارش شما ثبت شد"}
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
            سفارش ثبت شد و در حال انجام است. می‌توانید آن را در «دارایی» دنبال
            کنید.
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
