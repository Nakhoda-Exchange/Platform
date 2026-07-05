"use client";

import { useState, useTransition } from "react";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import { requestCryptoWithdraw } from "@/app/actions/withdraw";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CoinIcon } from "@/components/market/coin-icon";
import { WithdrawResult } from "./withdraw-result";
import { toEnglishDigits } from "@/lib/utils/digits";
import { formatCoinAmount } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** Parse a typed coin amount (Persian digits/«٫» allowed) → number. */
function parseAmount(value: string): number {
  return Number(
    toEnglishDigits(value)
      .replace("٫", ".")
      .replace(/[^\d.]/g, ""),
  );
}

/**
 * Crypto withdrawal to an external address: coin (from holdings), address,
 * amount, network fee + net received. The request stays pending.
 */
export function CryptoWithdrawForm({
  holdings,
  fees,
}: {
  holdings: Holding[];
  fees: Record<string, number>;
}) {
  const [coinId, setCoinId] = useState(holdings[0]?.coin.id ?? "");
  const [address, setAddress] = useState("");
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const holding = holdings.find((h) => h.coin.id === coinId);
  const held = holding?.amount ?? 0;
  const fee = fees[coinId] ?? 0;
  const amount = parseAmount(amountText);
  const net = Math.max(0, amount - fee);

  const clientError =
    amount > 0 && amount <= fee
      ? "مقدار برداشت باید از کارمزد شبکه بیشتر باشد."
      : amount > held
        ? "موجودی این رمزارز کافی نیست."
        : null;
  const valid =
    coinId !== "" &&
    address.trim().length >= 20 &&
    amount > fee &&
    amount <= held;

  if (done && holding) {
    return <WithdrawResult summary={done} />;
  }

  if (holdings.length === 0) {
    return (
      <p className="p-6 text-center text-[15px] leading-7 text-muted">
        رمزارزی برای برداشت ندارید. اول از بازار خرید کنید.
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <nav aria-label="انتخاب رمزارز" className="flex gap-2 overflow-x-auto">
        {holdings.map((h) => (
          <button
            key={h.coin.id}
            type="button"
            onClick={() => setCoinId(h.coin.id)}
            aria-pressed={h.coin.id === coinId}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-colors",
              h.coin.id === coinId
                ? "bg-brand/10 text-brand"
                : "bg-surface text-muted hover:text-ink",
            )}
          >
            <CoinIcon coin={h.coin} size={20} />
            {h.coin.symbol}
          </button>
        ))}
      </nav>

      <Field
        name="address"
        label="آدرس مقصد"
        dir="ltr"
        placeholder="0x…"
        autoComplete="off"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <Field
        name="amountCoin"
        label={`مقدار (${holding?.coin.symbol ?? ""})`}
        inputMode="decimal"
        dir="ltr"
        placeholder="۰٫۰۰۱"
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
        error={clientError ?? error}
      />

      <div className="flex items-center justify-between text-[14px]">
        <span className="text-muted">
          موجودی:{" "}
          <span className="font-bold text-ink" dir="ltr">
            {formatCoinAmount(held)} {holding?.coin.symbol}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setAmountText(String(held))}
          disabled={held <= 0}
          className="rounded-full bg-brand/10 px-4 py-1.5 font-bold text-brand transition-colors hover:bg-brand/15 disabled:opacity-50"
        >
          همه
        </button>
      </div>

      <dl className="flex flex-col gap-2 rounded-card bg-surface p-4 text-[14px]">
        <div className="flex items-center justify-between">
          <dt className="text-muted">کارمزد شبکه</dt>
          <dd className="font-bold text-ink" dir="ltr">
            {formatCoinAmount(fee)} {holding?.coin.symbol}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">دریافتی خالص</dt>
          <dd className="font-bold text-ink" dir="ltr">
            {formatCoinAmount(net)} {holding?.coin.symbol}
          </dd>
        </div>
      </dl>

      <div className="mt-auto">
        <Button
          type="button"
          size="xl"
          fullWidth
          disabled={!valid || pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await requestCryptoWithdraw(
                coinId,
                address,
                amountText,
              );
              if (!result.ok) setError(result.message);
              else
                setDone(
                  `${formatCoinAmount(net)} ${holding?.coin.symbol} به آدرس مقصد`,
                );
            })
          }
        >
          {pending ? "در حال ثبت درخواست…" : "ثبت درخواست برداشت"}
        </Button>
      </div>
    </div>
  );
}
