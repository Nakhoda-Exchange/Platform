"use client";

import { useState, useTransition } from "react";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import { MIN_WITHDRAW_IRT } from "@/lib/core/domain/wallet/withdraw";
import { requestIrtWithdraw } from "@/app/actions/withdraw";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { WalletIcon } from "@/components/ui/icons";
import { IbanPicker } from "./iban-picker";
import { WalletEmpty } from "./wallet-empty";
import { WithdrawResult } from "./withdraw-result";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { formatIrt } from "@/lib/utils/money";

/** Toman withdrawal to one of the user's IBANs (شبا); the request stays pending. */
export function IrtWithdrawForm({
  initialIbans,
  cards,
  availableIrt,
}: {
  initialIbans: Iban[];
  cards: BankCard[];
  availableIrt: number;
}) {
  const [ibans, setIbans] = useState(initialIbans);
  const [selectedId, setSelectedId] = useState(
    (initialIbans.find((i) => i.primary) ?? initialIbans[0])?.id ?? "",
  );
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const amount = Number(digits || "0");
  const clientError =
    amount > 0 && amount < MIN_WITHDRAW_IRT
      ? "کمینه برداشت ۵۰۰٬۰۰۰ تومان است."
      : amount > availableIrt
        ? "موجودی شما کافی نیست."
        : null;
  const valid =
    amount >= MIN_WITHDRAW_IRT && amount <= availableIrt && selectedId !== "";

  if (done) {
    return <WithdrawResult summary={`${formatIrt(amount)} به شبای شما`} />;
  }

  // Toman is only withdrawable once you have some. Explain how to get it here,
  // where the user is actually trying to withdraw it.
  if (availableIrt <= 0) {
    return (
      <WalletEmpty
        icon={<WalletIcon size={30} />}
        title="موجودی تومانی برای برداشت نداری"
        message="برای برداشت تومان، اول باید دارایی‌هایت را بفروشی تا به موجودی تومانی تبدیل شود."
        cta={{ href: "/market", label: "فروش دارایی‌ها" }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Field
        name="amountIrt"
        label="مبلغ برداشت (تومان)"
        inputMode="numeric"
        dir="ltr"
        placeholder="۱٬۰۰۰٬۰۰۰"
        value={
          digits ? toPersianDigits(Number(digits).toLocaleString("en-US")) : ""
        }
        onChange={(e) =>
          setDigits(toEnglishDigits(e.target.value).replace(/[^\d]/g, ""))
        }
        error={clientError ?? error}
      />

      <div className="flex items-center justify-between text-[14px]">
        <span className="text-muted">
          موجودی قابل برداشت:{" "}
          <span className="font-bold text-ink">{formatIrt(availableIrt)}</span>
        </span>
        <button
          type="button"
          onClick={() => setDigits(String(availableIrt))}
          disabled={availableIrt <= 0}
          className="rounded-full bg-brand/10 px-4 py-1.5 font-bold text-brand transition-colors hover:bg-brand/15 disabled:opacity-50"
        >
          همه
        </button>
      </div>

      <IbanPicker
        label="شبای مقصد"
        ibans={ibans}
        cards={cards}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onIbanAdded={(iban) => {
          setIbans((cur) =>
            cur.some((i) => i.id === iban.id) ? cur : [...cur, iban],
          );
          setSelectedId(iban.id);
        }}
      />

      <p className="text-[13px] text-muted">کارمزد برداشت تومانی: رایگان</p>

      <div className="mt-auto">
        <Button
          type="button"
          size="xl"
          fullWidth
          disabled={!valid || pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await requestIrtWithdraw(selectedId, digits);
              if (!result.ok) setError(result.message);
              else setDone(true);
            })
          }
        >
          {pending ? "در حال ثبت درخواست…" : "ثبت درخواست برداشت"}
        </Button>
      </div>
    </div>
  );
}
