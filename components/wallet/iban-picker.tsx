"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import { sameBank } from "@/lib/core/domain/wallet/iranian-banks";
import { addIban } from "@/app/actions/bank-account";
import { Button } from "@/components/ui/button";
import { BankLogo } from "@/components/ui/bank-logo";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { CheckCircleIcon } from "@/components/ui/icons";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

/** "IR" + 24 digits → «IR ۰۶۰۱ ۲۰۰۰ …» grouped in fours (LTR). */
export function formatIban(value: string): string {
  const digits = value.replace(/^IR/, "");
  return `IR ${toPersianDigits(digits.replace(/(\d{4})(?=\d)/g, "$1 "))}`;
}

/** 16 digits → «۶۲۱۹ •••• ۵۱۶۴», middle masked (LTR). */
function maskCard(number: string): string {
  return toPersianDigits(`${number.slice(0, 4)} •••• ${number.slice(-4)}`);
}

/**
 * The user's IBANs (شبا) as a radio list + an add-IBAN bottom sheet, for
 * Toman withdrawal. Each row shows the matched bank card (same bank as the
 * IBAN) as a subdued subhead when one exists.
 */
export function IbanPicker({
  label,
  ibans,
  cards,
  selectedId,
  onSelect,
  onIbanAdded,
}: {
  label: string;
  ibans: Iban[];
  cards: BankCard[];
  selectedId: string;
  onSelect: (id: string) => void;
  onIbanAdded: (iban: Iban) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await addIban(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onIbanAdded(result.data);
      setInput("");
      setSheetOpen(false);
    });

  const addSheet = (
    <Sheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      title="افزودن شماره شبا"
    >
      <Field
        name="iban"
        label="شماره شبا (۲۴ رقم، بدون IR)"
        inputMode="numeric"
        dir="ltr"
        placeholder="۰۶۰۱۲۰۰۰۰۰…"
        value={toPersianDigits(input.replace(/(\d{4})(?=\d)/g, "$1 "))}
        onChange={(e) => {
          setError(null);
          setInput(
            toEnglishDigits(e.target.value).replace(/[^\d]/g, "").slice(0, 24),
          );
        }}
        error={error}
      />
      <Button
        type="button"
        size="lg"
        fullWidth
        disabled={input.length !== 24 || pending}
        onClick={save}
      >
        {pending ? "در حال بررسی…" : "ذخیره شبا"}
      </Button>
    </Sheet>
  );

  if (ibans.length === 0) {
    return (
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-[13px] font-semibold text-ink">
          {label}
        </legend>
        <div className="flex flex-col items-center gap-3 rounded-field border border-dashed border-line p-5 text-center">
          <p className="text-[14px] leading-[1.9] text-muted">
            برای برداشت باید یک شماره شبا اضافه کنی.
          </p>
          <Button type="button" size="md" onClick={() => setSheetOpen(true)}>
            + افزودن شبا
          </Button>
          <Link
            href="/account/bank-accounts"
            className="text-[13px] font-bold text-brand"
          >
            مدیریت حساب‌های بانکی
          </Link>
        </div>
        {addSheet}
      </fieldset>
    );
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-2 text-[13px] font-semibold text-ink">
        {label}
      </legend>
      {ibans.map((iban) => {
        const matchedCard = cards.find((c) => sameBank(c.number, iban.value));
        return (
          <label
            key={iban.id}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-field border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
              selectedId === iban.id
                ? "border-brand bg-brand/5"
                : "border-line bg-surface",
            )}
          >
            <input
              type="radio"
              name="iban"
              checked={selectedId === iban.id}
              onChange={() => onSelect(iban.id)}
              className="sr-only"
            />
            <span className="flex items-center gap-3">
              <BankLogo kind="iban" value={iban.value} size={40} />
              <span className="flex flex-col gap-0.5">
                <span dir="ltr" className="text-[15px] font-bold text-ink">
                  {formatIban(iban.value)}
                </span>
                {matchedCard ? (
                  <span dir="ltr" className="text-[12px] text-muted">
                    کارت: {maskCard(matchedCard.number)}
                  </span>
                ) : null}
              </span>
            </span>
            {selectedId === iban.id ? (
              <CheckCircleIcon size={20} className="text-brand" />
            ) : null}
          </label>
        );
      })}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex h-12 items-center justify-center rounded-field border border-dashed border-line text-[14px] font-bold text-brand transition-colors hover:bg-brand/5"
      >
        + افزودن شبا
      </button>

      {addSheet}
    </fieldset>
  );
}
