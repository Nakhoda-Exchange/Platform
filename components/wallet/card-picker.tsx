"use client";

import { useState, useTransition } from "react";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import { addBankCard } from "@/app/actions/deposit";
import { Button } from "@/components/ui/button";
import { BankLogo } from "@/components/ui/bank-logo";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { CheckCircleIcon } from "@/components/ui/icons";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

/** 16 digits → «۶۲۱۹ ۸۶۱۹ ۰۰۰۴ ۵۸۷۵» for display (LTR). */
export function formatCard(number: string): string {
  return toPersianDigits(number.replace(/(\d{4})(?=\d)/g, "$1 "));
}

/**
 * The user's bank cards as a radio list + an add-card bottom sheet
 * (16 digits + Luhn validated server-side). Used by deposit AND withdraw.
 */
export function CardPicker({
  label,
  cards,
  selectedId,
  onSelect,
  onCardAdded,
}: {
  label: string;
  cards: BankCard[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCardAdded: (card: BankCard) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cardInput, setCardInput] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-2 text-[13px] font-semibold text-ink">
        {label}
      </legend>
      {cards.map((card) => (
        <label
          key={card.id}
          className={cn(
            "flex cursor-pointer items-center justify-between rounded-field border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
            selectedId === card.id
              ? "border-brand bg-brand/5"
              : "border-line bg-surface",
          )}
        >
          <input
            type="radio"
            name="card"
            checked={selectedId === card.id}
            onChange={() => onSelect(card.id)}
            className="sr-only"
          />
          <span className="flex items-center gap-3">
            <BankLogo kind="card" value={card.number} size={40} />
            <span dir="ltr" className="text-[15px] font-bold text-ink">
              {formatCard(card.number)}
            </span>
          </span>
          {selectedId === card.id ? (
            <CheckCircleIcon size={20} className="text-brand" />
          ) : null}
        </label>
      ))}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex h-12 items-center justify-center rounded-field border border-dashed border-line text-[14px] font-bold text-brand transition-colors hover:bg-brand/5"
      >
        + افزودن کارت جدید
      </button>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="افزودن کارت بانکی"
      >
        <Field
          name="cardNumber"
          label="شماره کارت (۱۶ رقم)"
          inputMode="numeric"
          dir="ltr"
          placeholder="۶۰۳۷ ۹۹۷۵ ۹۹۵۷ ۱۳۴۶"
          value={toPersianDigits(cardInput.replace(/(\d{4})(?=\d)/g, "$1 "))}
          onChange={(e) => {
            setCardError(null);
            setCardInput(
              toEnglishDigits(e.target.value)
                .replace(/[^\d]/g, "")
                .slice(0, 16),
            );
          }}
          error={cardError}
        />
        <Button
          type="button"
          size="lg"
          fullWidth
          disabled={cardInput.length !== 16 || pending}
          onClick={() =>
            startTransition(async () => {
              const result = await addBankCard(cardInput);
              if (!result.ok) {
                setCardError(result.message);
                return;
              }
              onCardAdded(result.data);
              setCardInput("");
              setSheetOpen(false);
            })
          }
        >
          ذخیره کارت
        </Button>
      </Sheet>
    </fieldset>
  );
}
