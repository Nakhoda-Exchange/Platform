"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type {
  OpenOrder,
  OrderStatus,
  TradeSide,
} from "@/lib/core/domain/trade/order";
import { cancelOrder } from "@/app/actions/orders";
import { Button, buttonClasses } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { ClockIcon, TrashIcon } from "@/components/ui/icons";
import { formatCoinAmount, formatIrt } from "@/lib/utils/money";
import { formatJalaliDayShort, formatTimeFa } from "@/lib/utils/jalali";
import { toPersianDigits } from "@/lib/utils/digits";
import { cn } from "@/lib/utils/cn";

const SIDE_LABEL: Record<TradeSide, string> = { buy: "خرید", sell: "فروش" };
const STATUS_LABEL: Record<OrderStatus, string> = {
  RESERVED: "در انتظار",
  SETTLED: "انجام‌شده",
  REJECTED: "ردشده",
  CANCELLED: "لغوشده",
};

/** The committed spend amount, rendered in its currency (IRT or the coin). */
function formatAmount(order: OpenOrder): string {
  return order.amountCurrency.toUpperCase() === "IRT"
    ? formatIrt(order.amount)
    : `${formatCoinAmount(order.amount)} ${order.displaySymbol}`;
}

/** ISO timestamp → «۱۳ تیر · ۱۴:۰۵»; empty when unparseable. */
function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatJalaliDayShort(date)} · ${formatTimeFa(date)}`;
}

/**
 * The user's open (resting) orders, each cancellable. Cancelling asks for
 * confirmation in a bottom sheet (matching the app's pattern for destructive
 * actions), then removes the row on success. A 409 «already executed» drops the
 * row too and toasts — the order filled, so it's no longer open.
 */
export function OpenOrdersList({
  initialOrders,
}: {
  initialOrders: OpenOrder[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [confirm, setConfirm] = useState<OpenOrder | null>(null);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const onConfirmCancel = () =>
    startTransition(async () => {
      if (!confirm) return;
      const target = confirm;
      const result = await cancelOrder(target.orderId);
      setConfirm(null);

      if (result.ok) {
        setOrders((prev) => prev.filter((o) => o.orderId !== target.orderId));
        toast({ variant: "success", title: "سفارش لغو شد" });
        return;
      }
      if (result.alreadyExecuted) {
        // Raced the fill — it's no longer open; drop it and tell the user.
        setOrders((prev) => prev.filter((o) => o.orderId !== target.orderId));
        toast({
          variant: "info",
          title: "این سفارش انجام شده بود",
          description: "سفارش پیش از لغو انجام شد و از فهرست حذف شد.",
        });
        return;
      }
      toast({
        variant: "error",
        title: "لغو سفارش ممکن نشد",
        description: result.message,
      });
    });

  if (orders.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <ClockIcon size={40} className="text-placeholder" />
        <p className="text-[15px] text-muted">سفارش بازی ندارید.</p>
        <Link href="/market" className={buttonClasses({ size: "lg" })}>
          رفتن به بازار
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {orders.map((order) => (
          <li
            key={order.orderId}
            className="flex flex-col gap-2 rounded-card border border-line p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[12px] font-bold text-white",
                    order.side === "buy" ? "bg-brand" : "bg-loss",
                  )}
                >
                  {SIDE_LABEL[order.side]}
                </span>
                <span className="text-[15px] font-extrabold text-ink">
                  {order.displaySymbol}
                </span>
                <span className="text-[12px] text-muted">
                  {order.orderType === "LIMIT" ? "حد" : "بازار"}
                </span>
              </div>
              <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-muted">
                {STATUS_LABEL[order.status]}
              </span>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted">مقدار</dt>
                <dd className="font-bold text-ink">{formatAmount(order)}</dd>
              </div>
              {order.orderType === "LIMIT" ? (
                <div className="flex items-center justify-between">
                  <dt className="text-muted">قیمت هدف</dt>
                  <dd className="font-bold text-ink">
                    {formatIrt(order.targetPrice)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <dt className="text-muted">زمان ثبت</dt>
                <dd className="text-muted">
                  {toPersianDigits(formatCreatedAt(order.createdAt))}
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirm(order)}
              className="self-start text-loss hover:bg-loss/10"
            >
              <TrashIcon size={15} />
              لغو سفارش
            </Button>
          </li>
        ))}
      </ul>

      {/* Confirm cancel */}
      <Sheet
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="لغو سفارش"
      >
        <p className="text-[15px] leading-[1.9] text-ink">
          این سفارش لغو شود؟ مبلغ رزروشده به موجودی شما بازمی‌گردد.
        </p>
        {confirm ? (
          <div className="flex items-center justify-between rounded-field bg-surface px-4 py-3">
            <span className="text-[14px] text-muted">
              {SIDE_LABEL[confirm.side]} {confirm.displaySymbol}
            </span>
            <span className="text-[14px] font-bold text-ink">
              {formatAmount(confirm)}
            </span>
          </div>
        ) : null}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            disabled={pending}
            onClick={() => setConfirm(null)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            size="lg"
            fullWidth
            disabled={pending}
            onClick={onConfirmCancel}
            className="bg-loss text-white"
          >
            {pending ? "در حال لغو…" : "لغو سفارش"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
