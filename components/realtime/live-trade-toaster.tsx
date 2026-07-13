"use client";

import type { ToastOptions } from "@/components/ui/toast";
import { useToast } from "@/components/ui/toast";
import { useTradeUpdates } from "@/lib/realtime/use-realtime";
import type { TradeUpdate } from "@/lib/core/domain/realtime/events";
import { toPersianDigits } from "@/lib/utils/digits";

const SIDE_FA: Record<TradeUpdate["side"], string> = {
  buy: "خرید",
  sell: "فروش",
};

/**
 * Bridges the realtime trade feed to toasts: it surfaces only terminal
 * transitions (filled / expired / failed) so the live churn of pending→open
 * never spams the user. Renders nothing — mount it once inside the platform
 * shell (under a {@link ToastProvider}).
 */
export function LiveTradeToaster() {
  const { toast } = useToast();

  useTradeUpdates((update) => {
    const options = toastFor(update);
    if (options) toast(options);
  });

  return null;
}

function toastFor(update: TradeUpdate): ToastOptions | null {
  const side = SIDE_FA[update.side];
  const amount = `${toPersianDigits(update.amountCoin)} ${update.symbol}`;

  switch (update.status) {
    case "done":
      return {
        variant: "success",
        title: `سفارش ${side} ${update.symbol} انجام شد`,
        description: `${amount} با موفقیت معامله شد.`,
      };
    case "expired":
      return {
        variant: "neutral",
        title: `سفارش ${side} ${update.symbol} منقضی شد`,
        description: `${amount} پیش از تکمیل منقضی شد.`,
      };
    case "failed":
      return {
        variant: "error",
        title: `سفارش ${side} ${update.symbol} ناموفق بود`,
        description: `${amount} معامله نشد.`,
      };
    default:
      // pending / open — live churn, not worth a toast.
      return null;
  }
}
