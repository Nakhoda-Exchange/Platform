"use client";

import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { formatChangePercent, formatIrtShort } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** «▲ +۱٬۲۳۴ ت (٪۵/۶)» gain/loss colored — sign and words, never color alone. */
function SignedIrt({ amount, percent }: { amount: number; percent: number }) {
  const up = amount >= 0;
  return (
    <span dir="ltr" className={cn("font-bold", up ? "text-gain" : "text-loss")}>
      {up ? "▲ +" : "▼ −"}
      {formatIrtShort(Math.abs(amount))} ({formatChangePercent(percent)})
    </span>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-4 last:border-0">
      <dt className="text-[15px] text-muted">{label}</dt>
      <dd className="text-[15px] font-bold text-ink">{children}</dd>
    </div>
  );
}

/**
 * The trader detail lives OFF the main screen: the wallet home shows one
 * compact profit pill; tapping it opens a 90vh bottom sheet with the full
 * breakdown (cash, holdings value, all-time profit, today, pending
 * withdrawals).
 */
export function PortfolioDetails({
  availableIrt,
  holdingsValueIrt,
  profitIrt,
  profitPercent,
  dayChangeIrt,
  dayChangePercent,
  pendingWithdrawIrt,
}: {
  availableIrt: number;
  holdingsValueIrt: number;
  profitIrt: number;
  profitPercent: number;
  dayChangeIrt: number;
  dayChangePercent: number;
  pendingWithdrawIrt: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-[13px] transition-colors hover:bg-line"
      >
        <span className="text-muted">سود کل</span>
        <SignedIrt amount={profitIrt} percent={profitPercent} />
        <ChevronLeftIcon size={14} className="text-placeholder" />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="جزئیات دارایی"
        panelClassName="h-[90vh]"
      >
        <dl className="flex flex-col">
          <Row label="موجودی تومانی">{formatIrtShort(availableIrt)}</Row>
          <Row label="ارزش رمزارزها">{formatIrtShort(holdingsValueIrt)}</Row>
          <Row label="سود کل">
            <SignedIrt amount={profitIrt} percent={profitPercent} />
          </Row>
          <Row label="امروز">
            <SignedIrt amount={dayChangeIrt} percent={dayChangePercent} />
          </Row>
          {pendingWithdrawIrt > 0 ? (
            <Row label="برداشت در انتظار">
              <span className="text-brand">
                {formatIrtShort(pendingWithdrawIrt)}
              </span>
            </Row>
          ) : null}
        </dl>
      </Sheet>
    </>
  );
}
