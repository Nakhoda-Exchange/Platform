"use client";

import { useState, type ReactNode } from "react";
import type { CoinDetail } from "@/lib/core/domain/market/coin-detail";
import { CheckIcon, CopyIcon, GlobeIcon } from "@/components/ui/icons";
import { parsePrice } from "@/lib/core/domain/market/price";
import { formatChangePercent, formatHemat, formatIrt } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** Human chain names; unknown ids fall back to a capitalized slug. */
const CHAIN_LABELS: Record<string, string> = {
  solana: "سولانا",
  ethereum: "اتریوم",
  eth: "اتریوم",
  bsc: "بی‌ان‌بی چین",
  "binance-smart-chain": "بی‌ان‌بی چین",
  base: "بیس",
  polygon: "پالیگان",
  arbitrum: "آربیتروم",
  avalanche: "آوالانچ",
  tron: "ترون",
};

function chainLabel(chainId: string): string {
  const key = chainId.toLowerCase();
  return (
    CHAIN_LABELS[key] ?? chainId.charAt(0).toUpperCase() + chainId.slice(1)
  );
}

/** Middle-truncate an on-chain address: «EPjF…Dt1v». */
function shortAddress(address: string): string {
  return address.length <= 14
    ? address
    : `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** One label/value line: label on the right (RTL), figure on the left. */
function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-3 last:border-0">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd dir="ltr" className="text-[14px] font-bold text-ink">
        {children}
      </dd>
    </div>
  );
}

/** Tap-to-copy contract address (client-only; degrades if clipboard is absent). */
function ContractRow({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — leave the address visible to copy by hand */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <dt className="shrink-0 text-[13px] text-muted">قرارداد</dt>
      <dd>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "آدرس قرارداد کپی شد" : "کپی آدرس قرارداد"}
          className="flex items-center gap-2 rounded-field text-[13px] font-bold text-ink transition-colors hover:text-brand"
        >
          <span dir="ltr" className="tabular-nums">
            {shortAddress(address)}
          </span>
          {copied ? (
            <CheckIcon size={15} className="text-gain" />
          ) : (
            <CopyIcon size={15} className="text-placeholder" />
          )}
        </button>
      </dd>
    </div>
  );
}

/**
 * «مشخصات بازار» — the coin's at-a-glance facts under the chart: chain + copyable
 * contract (tokens only), market cap, FDV, 24h volume, 24h high/low, 24h change,
 * and holder count when a source provides one. Every field is optional: a row is
 * shown only when its value is real, so a brand-new / sparse token renders a
 * complete, non-broken card (or nothing at all) instead of a wall of «۰»/«—».
 */
export function CoinInfoCard({ detail }: { detail: CoinDetail }) {
  const { coin } = detail;
  // Treat empty / "unknown" (seed-coin placeholder) as no chain — don't badge it.
  const chainId = coin.chainId?.trim();
  const chain =
    chainId && chainId.toLowerCase() !== "unknown" ? chainLabel(chainId) : null;
  const hasContract = !!coin.contractAddress?.trim();

  // Positive-only guards: 0/undefined means «unknown», not «zero» — hide it.
  const rows: ReactNode[] = [];
  if (Number.isFinite(coin.change24h)) {
    const up = coin.change24h >= 0;
    rows.push(
      <StatRow key="change" label="تغییر ۲۴ ساعته">
        <span
          aria-label={`${up ? "افزایش" : "کاهش"} ${formatChangePercent(coin.change24h)} در ۲۴ ساعت`}
          className={cn(up ? "text-gain" : "text-loss")}
        >
          {up ? "+" : "−"}
          {formatChangePercent(coin.change24h)}
        </span>
      </StatRow>,
    );
  }
  if (coin.marketCap > 0) {
    rows.push(
      <StatRow key="mcap" label="ارزش بازار">
        {formatHemat(coin.marketCap)}
      </StatRow>,
    );
  }
  if (coin.fdv != null && coin.fdv > 0) {
    rows.push(
      <StatRow key="fdv" label="ارزش کاملاً رقیق‌شده">
        {formatHemat(coin.fdv)}
      </StatRow>,
    );
  }
  if (detail.volume24h > 0) {
    rows.push(
      <StatRow key="vol" label="حجم معاملات ۲۴ ساعته">
        {formatHemat(detail.volume24h)}
      </StatRow>,
    );
  }
  // high/low are nullable decimal strings: null = unavailable → hide the row
  // (never «۰»/stale). Show it only when a real, positive figure parses out.
  const high24h = parsePrice(detail.high24h);
  if (high24h !== null && high24h > 0) {
    rows.push(
      <StatRow key="high" label="بیشترین قیمت ۲۴ ساعته">
        {formatIrt(detail.high24h)}
      </StatRow>,
    );
  }
  const low24h = parsePrice(detail.low24h);
  if (low24h !== null && low24h > 0) {
    rows.push(
      <StatRow key="low" label="کمترین قیمت ۲۴ ساعته">
        {formatIrt(detail.low24h)}
      </StatRow>,
    );
  }
  if (detail.holdersCount != null && detail.holdersCount > 0) {
    rows.push(
      <StatRow key="holders" label="تعداد دارندگان">
        {detail.holdersCount.toLocaleString("fa-IR")}
      </StatRow>,
    );
  }

  // Nothing real to show at all → render nothing (the page stays clean).
  if (!chain && !hasContract && rows.length === 0) return null;

  return (
    <section aria-label="مشخصات بازار" className="flex flex-col gap-2">
      <h2 className="text-[16px] font-bold text-ink">مشخصات بازار</h2>

      {(chain || hasContract) && (
        <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
          {chain && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-muted">شبکه</span>
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[12px] font-bold text-ink">
                <GlobeIcon size={14} className="text-brand" />
                {chain}
              </span>
            </div>
          )}
          {coin.contractAddress && (
            <dl className="flex flex-col">
              <ContractRow address={coin.contractAddress} />
            </dl>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <dl className="flex flex-col rounded-card bg-surface px-4">{rows}</dl>
      )}
    </section>
  );
}
