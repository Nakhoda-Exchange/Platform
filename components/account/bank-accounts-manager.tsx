"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import {
  addCard,
  addIban,
  removeCard,
  removeIban,
  setPrimaryCard,
  setPrimaryIban,
} from "@/app/actions/bank-account";
import { Button, buttonClasses } from "@/components/ui/button";
import { BankLogo } from "@/components/ui/bank-logo";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { CheckCircleIcon, StarIcon, TrashIcon } from "@/components/ui/icons";
import {
  detectBankByCard,
  detectBankByIban,
} from "@/lib/core/domain/wallet/iranian-banks";
import { formatCard } from "@/components/wallet/card-picker";
import { formatIban } from "@/components/wallet/iban-picker";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

type Tab = "card" | "iban";
type Pending = { action: "primary" | "remove"; id: string; display: string };

/** Copy that changes per tab, kept in one place. */
const COPY = {
  card: {
    noun: "کارت",
    addLabel: "افزودن کارت",
    sheetTitle: "افزودن کارت بانکی",
    fieldLabel: "شماره کارت (۱۶ رقم)",
    placeholder: "۶۰۳۷ ۹۹۷۵ ۹۹۵۷ ۱۳۴۶",
    empty: "هنوز کارتی اضافه نکرده‌اید.",
    len: 16,
  },
  iban: {
    noun: "شبا",
    addLabel: "افزودن شبا",
    sheetTitle: "افزودن شماره شبا",
    fieldLabel: "شماره شبا (۲۴ رقم، بدون IR)",
    placeholder: "۰۶۰۱۲۰۰۰۰۰…",
    empty: "هنوز شبایی اضافه نکرده‌اید.",
    len: 24,
  },
} as const;

/**
 * Manage the user's payout instruments — bank cards and IBANs (شبا) — in two
 * tabs. Each can be set primary (auto-selected for deposit/withdraw) or
 * removed; a number is never edited. Both destructive/important changes
 * (making primary, removing) are approved in a bottom sheet. Adding runs a KYC
 * ownership check server-side; a card/IBAN in someone else's name fails.
 */
export function BankAccountsManager({
  kycVerified,
  initialCards,
  initialIbans,
}: {
  kycVerified: boolean;
  initialCards: BankCard[];
  initialIbans: Iban[];
}) {
  const [tab, setTab] = useState<Tab>("card");
  const [cards, setCards] = useState(initialCards);
  const [ibans, setIbans] = useState(initialIbans);

  const [addOpen, setAddOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<Pending | null>(null);
  const [pending, startTransition] = useTransition();

  // KYC gate — adding and the ownership check both require a verified identity.
  if (!kycVerified) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-xs text-[15px] leading-[1.9] text-muted">
          برای افزودن کارت یا شبا، اول باید هویتت را تأیید کنی. حساب بانکی باید
          به نام خودت باشد.
        </p>
        <Link href="/kyc" className={buttonClasses({ size: "lg" })}>
          تأیید هویت
        </Link>
      </div>
    );
  }

  const copy = COPY[tab];

  const rows =
    tab === "card"
      ? cards.map((c) => {
          const bank = detectBankByCard(c.number);
          return {
            item: c,
            display: formatCard(c.number),
            logoValue: c.number,
            bankName: bank?.name,
            bankColor: bank?.color,
          };
        })
      : ibans.map((i) => {
          const bank = detectBankByIban(i.value);
          return {
            item: i,
            display: formatIban(i.value),
            logoValue: i.value,
            bankName: bank?.name,
            bankColor: bank?.color,
          };
        });

  const openAdd = () => {
    setInput("");
    setError(null);
    setAddOpen(true);
  };

  const onSave = () =>
    startTransition(async () => {
      const result =
        tab === "card" ? await addCard(input) : await addIban(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (tab === "card")
        setCards((prev) => [result.data as BankCard, ...prev]);
      else setIbans((prev) => [result.data as Iban, ...prev]);
      setAddOpen(false);
    });

  // Approve the pending primary/remove change from the confirmation sheet.
  const onApprove = () =>
    startTransition(async () => {
      if (!confirm) return;
      const { action, id } = confirm;
      const result =
        action === "primary"
          ? tab === "card"
            ? await setPrimaryCard(id)
            : await setPrimaryIban(id)
          : tab === "card"
            ? await removeCard(id)
            : await removeIban(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (action === "primary") {
        const flip = <T extends { id: string; primary: boolean }>(list: T[]) =>
          list.map((x) => ({ ...x, primary: x.id === id }));
        if (tab === "card") setCards(flip);
        else setIbans(flip);
      } else {
        const drop = <T extends { id: string; primary: boolean }>(
          list: T[],
        ) => {
          const next = list.filter((x) => x.id !== id);
          if (next.length && !next.some((x) => x.primary))
            return [{ ...next[0], primary: true }, ...next.slice(1)];
          return next;
        };
        if (tab === "card") setCards(drop);
        else setIbans(drop);
      }
      setConfirm(null);
    });

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Card / IBAN switch */}
      <div
        role="tablist"
        aria-label="نوع حساب بانکی"
        className="grid grid-cols-2 gap-1 rounded-full bg-surface p-1"
      >
        {(["card", "iban"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "h-11 rounded-full text-[15px] font-bold transition-colors",
              tab === t ? "bg-brand text-white" : "text-muted hover:text-ink",
            )}
          >
            {t === "card" ? "کارت‌ها" : "شبا"}
          </button>
        ))}
      </div>

      {/* Accounts */}
      {rows.length === 0 ? (
        <p className="rounded-card bg-surface p-6 text-center text-[15px] text-muted">
          {copy.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map(({ item, display, logoValue, bankName, bankColor }) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-card border p-3 transition-colors",
                item.primary ? "border-brand" : "border-line",
                !bankColor && "bg-surface",
              )}
              // Tint the row with the bank's brand color (subtle wash, ~12%);
              // ink text stays readable. Undetected banks fall back to surface.
              style={
                bankColor ? { backgroundColor: `${bankColor}1f` } : undefined
              }
            >
              <BankLogo kind={tab} value={logoValue} size={40} />

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  dir="ltr"
                  className="truncate text-right text-[15px] font-bold tracking-wide text-ink"
                >
                  {display}
                </span>
                <span className="flex items-center gap-1 truncate text-[12px] text-muted">
                  <CheckCircleIcon size={12} className="shrink-0 text-brand" />
                  <span className="truncate">
                    {bankName ? `${bankName} · ` : ""}
                    {item.ownerName}
                  </span>
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {item.primary ? (
                  <span className="flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[12px] font-bold text-white">
                    <StarIcon size={12} />
                    اصلی
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label="انتخاب به‌عنوان اصلی"
                    onClick={() =>
                      setConfirm({ action: "primary", id: item.id, display })
                    }
                    className="flex size-11 items-center justify-center rounded-field text-muted transition-colors hover:bg-brand/10 hover:text-brand"
                  >
                    <StarIcon size={17} />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="حذف"
                  onClick={() =>
                    setConfirm({ action: "remove", id: item.id, display })
                  }
                  className="flex size-11 items-center justify-center rounded-field text-muted transition-colors hover:bg-loss/10 hover:text-loss"
                >
                  <TrashIcon size={17} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Sticky add button — the one primary action */}
      <div className="sticky bottom-0 -mx-4 mt-auto border-t border-line bg-paper px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <Button type="button" size="lg" fullWidth onClick={openAdd}>
          {copy.addLabel}
        </Button>
      </div>

      {/* Add sheet */}
      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={copy.sheetTitle}
      >
        <div className="flex items-end gap-3">
          <BankLogo kind={tab} value={input} size={44} />
          <div className="flex-1">
            <Field
              name={tab}
              label={copy.fieldLabel}
              inputMode="numeric"
              dir="ltr"
              placeholder={copy.placeholder}
              value={toPersianDigits(input.replace(/(\d{4})(?=\d)/g, "$1 "))}
              onChange={(e) => {
                setError(null);
                setInput(
                  toEnglishDigits(e.target.value)
                    .replace(/[^\d]/g, "")
                    .slice(0, copy.len),
                );
              }}
              error={error}
            />
          </div>
        </div>
        <p className="-mt-1 text-[12px] leading-[1.8] text-muted">
          حساب باید به نام خودت باشد.
        </p>
        <Button
          type="button"
          size="lg"
          fullWidth
          disabled={input.length !== copy.len || pending}
          onClick={onSave}
        >
          {pending ? "در حال بررسی…" : "ذخیره"}
        </Button>
      </Sheet>

      {/* Approve primary / remove */}
      <Sheet
        open={confirm !== null}
        onClose={() => {
          setConfirm(null);
          setError(null);
        }}
        title={
          confirm?.action === "remove"
            ? `حذف ${copy.noun}`
            : `${copy.noun} اصلی`
        }
      >
        <p className="text-[15px] leading-[1.9] text-ink">
          {confirm?.action === "remove"
            ? `این ${copy.noun} حذف شود؟`
            : `این ${copy.noun} برای واریز و برداشت به‌صورت خودکار انتخاب شود؟`}
        </p>
        {confirm ? (
          <span
            dir="ltr"
            className="rounded-field bg-surface px-4 py-3 text-center text-[15px] font-bold tracking-wide text-ink"
          >
            {confirm.display}
          </span>
        ) : null}
        {error ? (
          <p className="text-right text-[13px] text-loss">{error}</p>
        ) : null}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => setConfirm(null)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            size="lg"
            fullWidth
            disabled={pending}
            onClick={onApprove}
            className={
              confirm?.action === "remove" ? "bg-loss text-white" : undefined
            }
          >
            {pending
              ? "در حال انجام…"
              : confirm?.action === "remove"
                ? "حذف"
                : "تأیید"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
