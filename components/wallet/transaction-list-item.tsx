import type { Transaction } from "@/lib/core/domain/wallet/transaction";
import { CoinIcon } from "@/components/market/coin-icon";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/ui/icons";
import { formatCoinAmount, formatIrtShort } from "@/lib/utils/money";
import { formatTimeFa } from "@/lib/utils/jalali";
import { cn } from "@/lib/utils/cn";

const TYPE_LABEL: Record<Transaction["type"], string> = {
  buy: "خرید",
  sell: "فروش",
  deposit: "واریز تومان",
  withdraw: "برداشت تومان",
};

const STATUS: Record<
  Transaction["status"],
  { label: string; className: string }
> = {
  done: { label: "انجام شد", className: "text-muted" },
  pending: { label: "در انتظار", className: "font-bold text-brand" },
  failed: { label: "ناموفق", className: "font-bold text-loss" },
};

/**
 * One history row. Right (RTL start): what happened + when; left: what moved.
 * Received amounts are green with «+», spent ones red with «−» — sign and
 * words always accompany the color.
 */
export function TransactionListItem({ tx }: { tx: Transaction }) {
  const trade = tx.type === "buy" || tx.type === "sell";
  const title = trade
    ? `${TYPE_LABEL[tx.type]} ${tx.coinName}`
    : TYPE_LABEL[tx.type];
  const status = STATUS[tx.status];

  // Primary line = what came in (+, green); secondary = what went out.
  const irt = formatIrtShort(tx.amountIrt);
  const coin = trade
    ? `${formatCoinAmount(tx.amountCoin ?? 0)} ${tx.symbol}`
    : "";
  const received = tx.type === "buy" ? coin : irt;
  const spent = tx.type === "buy" ? irt : tx.type === "sell" ? coin : null;
  const incoming = tx.type !== "withdraw";

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        {trade ? (
          <CoinIcon
            coin={{ iconUrl: tx.iconUrl ?? "", symbol: tx.symbol ?? "" }}
            size={42}
          />
        ) : (
          <span
            aria-hidden
            className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"
          >
            {tx.type === "deposit" ? (
              <ArrowDownIcon size={20} />
            ) : (
              <ArrowUpIcon size={20} />
            )}
          </span>
        )}
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">{title}</span>
          <span className="text-[12px] text-muted">
            {formatTimeFa(tx.at)} ·{" "}
            <span className={status.className}>{status.label}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-0.5" dir="ltr">
        <span
          className={cn(
            "text-[14px] font-bold",
            incoming ? "text-gain" : "text-loss",
          )}
        >
          {incoming ? "+" : "−"}
          {received}
        </span>
        {spent ? (
          <span className="text-[12px] text-muted">−{spent}</span>
        ) : null}
      </div>
    </div>
  );
}
