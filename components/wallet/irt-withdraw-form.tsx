"use client";

import { useEffect, useState, useTransition } from "react";
import type { Iban } from "@/lib/core/domain/wallet/bank-account";
import type { BankCard } from "@/lib/core/domain/wallet/bank-card";
import { MIN_WITHDRAW_IRT } from "@/lib/core/domain/wallet/withdraw";
import { computeWithdrawFee } from "@/lib/core/domain/wallet/wallet-config";
import { requestIrtWithdraw, requestWithdrawOtp } from "@/app/actions/withdraw";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { WalletIcon } from "@/components/ui/icons";
import { OtpInput } from "@/components/auth/otp-input";
import { IbanPicker } from "./iban-picker";
import { WalletEmpty } from "./wallet-empty";
import { WithdrawResult } from "./withdraw-result";
import { toEnglishDigits, toPersianDigits } from "@/lib/utils/digits";
import { formatIrt } from "@/lib/utils/money";

const OTP_LENGTH = 6;

/** Toman withdrawal to one of the user's IBANs (شبا); the request stays pending. */
export function IrtWithdrawForm({
  initialIbans,
  cards,
  availableIrt,
  minWithdrawIrt = MIN_WITHDRAW_IRT,
  feeBps = 0,
  feeCapIrt = 0,
  otpRequired = false,
}: {
  initialIbans: Iban[];
  cards: BankCard[];
  availableIrt: number;
  /** Minimum withdrawal (Toman) from the wallet config (#156); constant fallback. */
  minWithdrawIrt?: number;
  /** Withdrawal fee rate in basis points (#156). */
  feeBps?: number;
  /** Withdrawal fee cap (Toman) (#156). */
  feeCapIrt?: number;
  /** Whether the backend requires a `withdraw` OTP for this user (#154). */
  otpRequired?: boolean;
}) {
  const [ibans, setIbans] = useState(initialIbans);
  const [selectedId, setSelectedId] = useState(
    (initialIbans.find((i) => i.primary) ?? initialIbans[0])?.id ?? "",
  );
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // OTP second factor (#154): only when the backend requires it. `awaitingOtp`
  // flips after the code is sent; the countdown gates the resend.
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1_000);
    return () => clearInterval(t);
  }, [resendIn]);

  const amount = Number(digits || "0");
  const fee = computeWithdrawFee(amount, feeBps, feeCapIrt);
  const net = Math.max(0, amount - fee);
  const clientError =
    amount > 0 && amount < minWithdrawIrt
      ? `کمینه برداشت ${formatIrt(minWithdrawIrt)} است.`
      : amount > availableIrt
        ? "موجودی شما کافی نیست."
        : null;
  const valid =
    amount >= minWithdrawIrt && amount <= availableIrt && selectedId !== "";

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

  /** Actually submit the withdrawal (with the OTP when one was collected). */
  const submitWithdraw = () =>
    startTransition(async () => {
      setError(null);
      const result = await requestIrtWithdraw(
        selectedId,
        digits,
        otpRequired ? otp : undefined,
      );
      if (!result.ok) setError(result.message);
      else setDone(true);
    });

  /** Send the withdraw OTP, then reveal the code field. */
  const sendOtp = () =>
    startTransition(async () => {
      setError(null);
      const result = await requestWithdrawOtp();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAwaitingOtp(true);
      setResendIn(result.data.resendAfterSeconds);
    });

  // Step 2 (OTP-required only) — collect the code sent to the user's mobile.
  if (awaitingOtp) {
    return (
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-[15px] font-bold text-ink">کد تأیید برداشت</p>
          <p className="text-[13px] leading-6 text-muted">
            برای تأیید برداشت{" "}
            <span className="font-bold text-ink">{formatIrt(amount)}</span>، کد
            پیامک‌شده را وارد کنید.
          </p>
        </div>

        <OtpInput length={OTP_LENGTH} name="withdrawOtp" onChange={setOtp} />

        {error ? <p className="text-[13px] text-loss">{error}</p> : null}

        <div className="flex items-center justify-between text-[13px]">
          <button
            type="button"
            onClick={() => {
              setAwaitingOtp(false);
              setOtp("");
              setError(null);
            }}
            className="font-bold text-muted transition-colors hover:text-ink"
          >
            بازگشت
          </button>
          <button
            type="button"
            onClick={sendOtp}
            disabled={resendIn > 0 || pending}
            className="font-bold text-brand transition-colors hover:text-brand/80 disabled:text-placeholder"
          >
            {resendIn > 0
              ? `ارسال دوباره تا ${toPersianDigits(resendIn)} ثانیه`
              : "ارسال دوباره کد"}
          </button>
        </div>

        <div className="mt-auto">
          <Button
            type="button"
            size="xl"
            fullWidth
            disabled={otp.length < OTP_LENGTH || pending}
            onClick={submitWithdraw}
          >
            {pending ? "در حال ثبت درخواست…" : "تأیید و ثبت برداشت"}
          </Button>
        </div>
      </div>
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

      {/* Fee is DISPLAY-only — the authoritative fee is computed server-side and
          deducted NET from the withdrawal (#156). */}
      {fee > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-card bg-surface px-4 py-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">کارمزد برداشت</span>
            <span className="font-bold text-ink">{formatIrt(fee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">واریز به حساب شما</span>
            <span className="font-bold text-ink">{formatIrt(net)}</span>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-muted">کارمزد برداشت تومانی: رایگان</p>
      )}

      {error && !clientError ? (
        <p className="text-[13px] text-loss">{error}</p>
      ) : null}

      <div className="mt-auto">
        <Button
          type="button"
          size="xl"
          fullWidth
          disabled={!valid || pending}
          onClick={otpRequired ? sendOtp : submitWithdraw}
        >
          {pending
            ? otpRequired
              ? "در حال ارسال کد…"
              : "در حال ثبت درخواست…"
            : otpRequired
              ? "ادامه و دریافت کد تأیید"
              : "ثبت درخواست برداشت"}
        </Button>
      </div>
    </div>
  );
}
