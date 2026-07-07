"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type CSSProperties } from "react";
import {
  FEE_RATE,
  MIN_ORDER_IRT,
  type TradeContext,
  type TradeSide,
} from "@/lib/core/domain/trade/order";
import { placeTradeOrder } from "@/app/actions/trade";
import type { TradeFormState } from "@/app/actions/trade-state";
import { Button, buttonClasses } from "@/components/ui/button";
import { CheckCircleIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { Confetti } from "@/components/ui/confetti";
import { LivePriceChip } from "./live-price-chip";
import { Keypad } from "./keypad";
import { toPersianDigits } from "@/lib/utils/digits";
import { formatCoinAmount, formatIrt } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** Round a derived coin amount to 6 significant digits for display. */
function roundCoin(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Number(amount.toPrecision(6));
}

const SIDE_LABEL: Record<TradeSide, string> = { buy: "خرید", sell: "فروش" };

/** Tappable slider shortcuts (also the native tick marks). */
const SELL_PERCENT_POINTS = [10, 25, 50, 75, 100] as const;

/** How long the confirm sheet stays valid before it auto-closes. */
const CONFIRM_SECONDS = 30;
/** Per-device flag: the first trade earns the confetti welcome, once. */
const FIRST_TRADE_KEY = "nakhoda_has_traded";

/**
 * Trade screen (Moonshot-style): side toggle, Toman amount entered on a
 * keypad with live coin conversion, then an inline confirm step → server
 * action → success receipt. Server-side validation is authoritative; the
 * client checks only mirror it for instant feedback.
 */
export function TradeScreen({
  context,
  initialSide,
}: {
  context: TradeContext;
  initialSide: TradeSide;
}) {
  const { coin, availableIrt, availableCoin } = context;
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
  const [celebrate, setCelebrate] = useState(false);
  const [state, formAction, pending] = useActionState<TradeFormState, FormData>(
    placeTradeOrder,
    { status: "idle" },
  );

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

  // Every completed order lands on the same «submitted, awaiting fulfilment»
  // screen. The very first trade on this device also earns confetti + a welcome.
  useEffect(() => {
    if (state.status !== "success") return;
    if (localStorage.getItem(FIRST_TRADE_KEY)) return;
    localStorage.setItem(FIRST_TRADE_KEY, "1");
    const id = requestAnimationFrame(() => setCelebrate(true));
    return () => cancelAnimationFrame(id);
  }, [state.status]);

  const entered = Number(digits || "0");
  // Coin entry converts to Toman at the current price; the order (and every
  // guard and fee) stays Toman-denominated — the server action is unchanged.
  const amountIrt =
    unit === "irt" ? entered : Math.round(entered * coin.priceIrt);
  // Mirror of the server-side fee math (PlaceOrderUseCase is authoritative):
  // buyers pay the fee out of the entered amount, sellers out of the proceeds.
  const feeIrt = Math.round(amountIrt * FEE_RATE);
  const amountCoin = roundCoin(
    (amountIrt - (side === "buy" ? feeIrt : 0)) / coin.priceIrt,
  );
  const maxIrt =
    side === "buy" ? availableIrt : Math.floor(availableCoin * coin.priceIrt);
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

  // Buying beyond the Toman balance isn't a dead end — it's a nudge to top up
  // and come back with more to spend, so the CTA turns into a deposit link.
  const needsDeposit = side === "buy" && amountIrt > maxIrt;
  const error =
    side === "sell" && availableCoin <= 0
      ? "از این رمزارز موجودی ندارید."
      : amountIrt > 0 && amountIrt < MIN_ORDER_IRT
        ? "کمینه هر سفارش ۵۰۰٬۰۰۰ تومان است."
        : needsDeposit
          ? "موجودی کافی نیست. برای خرید، حساب خود را شارژ کنید."
          : amountIrt > maxIrt
            ? "موجودی شما کافی نیست."
            : null;
  const valid = amountIrt >= MIN_ORDER_IRT && amountIrt <= maxIrt;

  if (state.status === "success") {
    const o = state.order;
    return (
      <>
        {celebrate ? <Confetti /> : null}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 pb-8 text-center">
          <CheckCircleIcon size={64} className="text-brand" />
          <div className="flex flex-col gap-2">
            {celebrate ? (
              <>
                <h1 className="text-[22px] font-extrabold text-ink">
                  اولین معامله ثبت شد
                </h1>
                <p className="text-[17px] font-bold text-brand">
                  خوش آمدید، ناخدای جوان
                </p>
              </>
            ) : (
              <h1 className="text-[22px] font-extrabold text-ink">
                سفارش شما ثبت شد
              </h1>
            )}
            <p className="text-[15px] leading-7 text-muted">
              {formatCoinAmount(roundCoin(o.amountCoin))} {o.symbol} به ارزش{" "}
              {formatIrt(o.totalIrt)}
            </p>
            <p className="text-[14px] text-placeholder">
              در انتظار تکمیل معامله…
            </p>
          </div>
          <div className="flex w-full max-w-[360px] flex-col gap-3">
            <Link
              href="/wallet"
              className={buttonClasses({ size: "lg", fullWidth: true })}
            >
              مشاهده دارایی‌ها
            </Link>
            <Link
              href="/market"
              className={buttonClasses({
                variant: "ghost",
                size: "lg",
                fullWidth: true,
              })}
            >
              بازگشت به بازار
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-6 pt-4">
      {/* Live market price — centered, green, pulsing (display only). */}
      <LivePriceChip basePrice={coin.priceIrt} />

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
                    : roundCoin(maxIrt / coin.priceIrt),
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
            : `${formatCoinAmount(roundCoin(availableCoin))} ${coin.symbol}`}
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
            {coin.symbol}
          </span>
        )}
        {/* Equivalent value — always shown as plain text so you see the amount
            AND what it's worth in the other unit (selling BTC still shows the
            Toman value); the ⇅ button just swaps which unit you type in. */}
        <div className="flex items-center gap-2 text-muted">
          <span dir="ltr" className="text-[15px]">
            {unit === "irt"
              ? `≈ ${formatCoinAmount(amountCoin)} ${coin.symbol}`
              : `≈ ${formatIrt(amountIrt)}`}
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
          className="min-h-[1.25rem] text-[13px] font-bold text-loss"
        >
          {error}
        </p>
      </div>

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
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="coinId" value={coin.id} />
          <input type="hidden" name="side" value={side} />
          <input type="hidden" name="amountIrt" value={amountIrt} />

          <dl className="flex flex-col divide-y divide-line rounded-card border border-line">
            {[
              ["نوع سفارش", `${SIDE_LABEL[side]} بازار`],
              ["مقدار", `${formatCoinAmount(amountCoin)} ${coin.symbol}`],
              ["قیمت واحد", formatIrt(coin.priceIrt)],
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

          {state.status === "error" ? (
            <p role="alert" className="text-[14px] font-bold text-loss">
              {state.message}
            </p>
          ) : null}

          <p className="text-center text-[12px] text-placeholder">
            این تأیید تا {toPersianDigits(secondsLeft)} ثانیه دیگر معتبر است
          </p>

          <div className="flex flex-col gap-2">
            <Button type="submit" size="xl" fullWidth disabled={pending}>
              {pending ? "در حال ثبت سفارش…" : `تأیید ${SIDE_LABEL[side]}`}
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
    </div>
  );
}
