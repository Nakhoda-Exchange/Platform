import type { Coin } from "@/lib/core/domain/market/coin";

/**
 * A subtle chip telling the viewer the asset's class: a native L1 «کوین»
 * (coin) versus an on-chain contract «توکن» (token). Renders nothing when the
 * market feed did not carry a kind, so the header degrades gracefully.
 */
export function CoinKindBadge({ kind }: { kind?: Coin["kind"] }) {
  if (kind !== "coin" && kind !== "token") return null;

  return (
    <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-medium leading-none text-muted">
      {kind === "coin" ? "کوین" : "توکن"}
    </span>
  );
}
