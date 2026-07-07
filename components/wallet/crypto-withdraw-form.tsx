"use client";

import { useState, useTransition } from "react";
import type { Holding } from "@/lib/core/domain/portfolio/portfolio";
import { requestCryptoWithdraw } from "@/app/actions/withdraw";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SearchIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { CoinIcon } from "@/components/market/coin-icon";
import { WithdrawResult } from "./withdraw-result";
import { toEnglishDigits } from "@/lib/utils/digits";
import { formatCoinAmount } from "@/lib/utils/money";

/** Parse a typed coin amount (Persian digits/«٫» allowed) → number. */
function parseAmount(value: string): number {
  return Number(
    toEnglishDigits(value)
      .replace("٫", ".")
      .replace(/[^\d.]/g, ""),
  );
}

/**
 * Crypto withdrawal to an external address. Step one is picking WHICH coin —
 * a searchable list of the user's holdings; the address/amount/fee fields only
 * appear once a coin is chosen, so the screen never asks for an amount before
 * it knows of what.
 */
export function CryptoWithdrawForm({
  holdings,
  fees,
}: {
  holdings: Holding[];
  fees: Record<string, number>;
}) {
  const [coinId, setCoinId] = useState("");
  const [query, setQuery] = useState("");
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

  // Step 1 — pick the coin. A searchable list of holdings; nothing else shows
  // until one is chosen.
  if (!holding) {
    const q = toEnglishDigits(query).trim().toLowerCase();
    const matches = holdings.filter(
      (h) =>
        !q ||
        h.coin.name.includes(query.trim()) ||
        h.coin.symbol.toLowerCase().includes(q),
    );
    return (
      <div className="flex flex-1 flex-col gap-4">
        <label className="flex h-[54px] items-center gap-2 rounded-[27px] bg-surface px-[18px]">
          <SearchIcon size={20} className="shrink-0 text-placeholder" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی رمزارز برای برداشت…"
            aria-label="جستجوی رمزارز"
            className="w-full bg-transparent text-right text-[16px] text-ink outline-none placeholder:text-placeholder"
          />
        </label>

        {matches.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-muted">
            رمزارزی پیدا نشد.
          </p>
        ) : (
          <ul className="-mx-4 flex flex-col divide-y divide-line">
            {matches.map((h) => (
              <li key={h.coin.id}>
                <button
                  type="button"
                  onClick={() => setCoinId(h.coin.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition-colors hover:bg-surface"
                >
                  <div className="flex items-center gap-3">
                    <CoinIcon coin={h.coin} size={40} />
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-ink">
                        {h.coin.name}
                      </span>
                      <span className="text-[12px] text-muted" dir="ltr">
                        {h.coin.symbol}
                      </span>
                    </div>
                  </div>
                  <span className="text-[14px] font-bold text-ink" dir="ltr">
                    {formatCoinAmount(h.amount)} {h.coin.symbol}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Step 2 — the chosen coin (tap to change) + the withdrawal fields.
  return (
    <div className="flex flex-1 flex-col gap-5">
      <button
        type="button"
        onClick={() => {
          setCoinId("");
          setQuery("");
          setAmountText("");
          setAddress("");
          setError(null);
        }}
        className="flex items-center justify-between gap-3 rounded-card bg-surface p-3 text-right"
      >
        <span className="flex items-center gap-3">
          <CoinIcon coin={holding.coin} size={36} />
          <span className="flex flex-col">
            <span className="text-[15px] font-bold text-ink">
              {holding.coin.name}
            </span>
            <span className="text-[12px] text-muted" dir="ltr">
              {holding.coin.symbol}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-1 text-[13px] font-bold text-brand">
          تغییر
          <ChevronLeftIcon size={16} />
        </span>
      </button>

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
        label={`مقدار (${holding.coin.symbol})`}
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
            {formatCoinAmount(held)} {holding.coin.symbol}
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
            {formatCoinAmount(fee)} {holding.coin.symbol}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted">دریافتی خالص</dt>
          <dd className="font-bold text-ink" dir="ltr">
            {formatCoinAmount(net)} {holding.coin.symbol}
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
                  `${formatCoinAmount(net)} ${holding.coin.symbol} به آدرس مقصد`,
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
