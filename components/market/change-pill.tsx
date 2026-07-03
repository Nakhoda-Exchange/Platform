import { formatChangePercent } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/**
 * 24h change pill. Green for gains, red for losses — and an ▲/▼ arrow so the
 * direction never rides on color alone (a11y + the Nakhoda UX guide).
 */
export function ChangePill({ change }: { change: number }) {
  const up = change >= 0;
  return (
    <span
      dir="ltr"
      aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(change)}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-bold",
        up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
      )}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {formatChangePercent(change)}
    </span>
  );
}
