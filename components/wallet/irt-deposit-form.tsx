"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { CardDeposit } from "@/lib/core/domain/wallet/deposit";
import { MIN_DEPOSIT_IRT } from "@/lib/core/domain/wallet/deposit";
import { checkDeposit, startCardDeposit } from "@/app/actions/deposit";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { CheckCircleIcon } from "@/components/ui/icons";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { formatIrt } from "@/lib/utils/money";
import { CopyButton } from "./copy-button";
import { CardPicker, formatCard } from "./card-picker";
import { cn } from "@/lib/utils/cn";

const QUICK_AMOUNTS = [500_000, 1_000_000, 5_000_000];
const POLL_MS = 3_000;

/**
 * Card-to-card Toman deposit, three steps:
 * 1. amount + pick YOUR card (bottom sheet adds one when none is saved);
 * 2. the company's card — fetched per deposit — to transfer to manually,
 *    with a countdown while we wait for the backend's deposit-submitted event;
 * 3. receipt.
 */
export function IrtDepositForm({ initialCards }: { initialCards: BankCard[] }) {
  const [cards, setCards] = useState(initialCards);
  const [selectedId, setSelectedId] = useState(initialCards[0]?.id ?? "");
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // started deposit (step 2) + its countdown/polling
  const [deposit, setDeposit] = useState<CardDeposit | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const amount = Number(digits || "0");
  const belowMin = amount > 0 && amount < MIN_DEPOSIT_IRT;

  useEffect(() => {
    if (!deposit || submitted) return;
    const tick = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1_000,
    );
    const poll = setInterval(async () => {
      const result = await checkDeposit(deposit.id);
      if (result.ok && result.data === "done") setSubmitted(true);
    }, POLL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [deposit, submitted]);

  // Step 3 — receipt (the backend confirmed the transfer).
  if (submitted && deposit) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <CheckCircleIcon size={64} className="text-brand" />
        <div className="flex flex-col gap-2">
          <h2 className="text-[22px] font-extrabold text-ink">
            واریز شما تأیید شد
          </h2>
          <p className="text-[16px] text-muted">
            {formatIrt(amount)} به موجودی شما اضافه شد.
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
            href="/wallet/history"
            className={buttonClasses({
              variant: "ghost",
              size: "lg",
              fullWidth: true,
            })}
          >
            مشاهده تاریخچه
          </Link>
        </div>
      </div>
    );
  }

  // Step 2 — the fetched company card + countdown while waiting for the event.
  if (deposit) {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return (
      <div className="flex flex-1 flex-col gap-5">
        <p className="text-[15px] leading-7 text-muted">
          مبلغ <span className="font-bold text-ink">{formatIrt(amount)}</span>{" "}
          را کارت‌به‌کارت به شماره زیر واریز کنید. پس از واریز، تأیید به‌صورت
          خودکار انجام می‌شود.
        </p>

        <div className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-5">
          <span
            dir="ltr"
            className="text-[22px] font-extrabold tracking-wider text-ink"
          >
            {formatCard(deposit.companyCard)}
          </span>
          <span className="text-[14px] text-muted">
            به نام {deposit.companyName}
          </span>
        </div>

        <CopyButton value={deposit.companyCard} />

        <div className="flex flex-col items-center gap-1 pt-2 text-center">
          <span
            dir="ltr"
            aria-live="polite"
            className={cn(
              "text-[32px] font-extrabold",
              secondsLeft > 60 ? "text-brand" : "text-loss",
            )}
          >
            {toPersianDigits(`${mm}:${ss}`)}
          </span>
          <span className="text-[13px] text-muted">
            {secondsLeft > 0
              ? "در انتظار تأیید واریز…"
              : "مهلت واریز تمام شد. اگر واریز کرده‌اید، از تاریخچه پیگیری کنید."}
          </span>
        </div>

        <div className="mt-auto">
          <Link
            href="/wallet/history"
            className={buttonClasses({
              variant: "ghost",
              size: "lg",
              fullWidth: true,
              className: "bg-surface",
            })}
          >
            پیگیری در تاریخچه
          </Link>
        </div>
      </div>
    );
  }

  // Step 1 — amount + source-card selection.
  const canStart = amount >= MIN_DEPOSIT_IRT && selectedId !== "" && !pending;
  return (
    <div className="flex flex-1 flex-col gap-5">
      <Field
        name="amountIrt"
        label="مبلغ واریز (تومان)"
        inputMode="numeric"
        dir="ltr"
        placeholder="۱٬۰۰۰٬۰۰۰"
        value={
          digits ? toPersianDigits(Number(digits).toLocaleString("en-US")) : ""
        }
        onChange={(e) =>
          setDigits(toEnglishDigits(e.target.value).replace(/[^\d]/g, ""))
        }
        error={belowMin ? "کمینه واریز ۱۰۰٬۰۰۰ تومان است." : error}
      />

      <div className="flex gap-2">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setDigits(String(q))}
            className={cn(
              "h-10 flex-1 rounded-full text-[13px] font-bold transition-colors",
              amount === q
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:text-ink",
            )}
          >
            {formatIrt(q)}
          </button>
        ))}
      </div>

      <CardPicker
        label="کارت مبدأ"
        cards={cards}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCardAdded={(card) => {
          setCards((cur) =>
            cur.some((c) => c.id === card.id) ? cur : [...cur, card],
          );
          setSelectedId(card.id);
        }}
      />

      <div className="mt-auto">
        <Button
          type="button"
          size="xl"
          fullWidth
          disabled={!canStart}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await startCardDeposit(selectedId, digits);
              if (!result.ok) {
                setError(result.message);
              } else {
                setSecondsLeft(result.data.expiresInSeconds);
                setDeposit(result.data);
              }
            })
          }
        >
          {pending ? "در حال دریافت شماره کارت…" : "دریافت شماره کارت واریز"}
        </Button>
      </div>
    </div>
  );
}
