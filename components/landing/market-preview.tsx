import { SearchIcon } from "@/components/ui/icons";
import { MiniSpark } from "./mini-spark";

/** Colored letter badge standing in for a coin logo (a coin's colour is its
 *  identity — the deliberate exception to the blue-only palette, like CoinIcon). */
function Badge({ t, c, size = 26 }: { t: string; c: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{
        width: size,
        height: size,
        background: c,
        fontSize: size * 0.46,
      }}
    >
      {t}
    </span>
  );
}

const GAINERS = [
  {
    name: "سولانا",
    sym: "SOL",
    t: "S",
    c: "#9945ff",
    price: "۸٬۳۰۰٬۰۰۰",
    ch: "۱۴٫۵",
  },
  {
    name: "تون‌کوین",
    sym: "TON",
    t: "T",
    c: "#0098ea",
    price: "۳۲۰٬۰۰۰",
    ch: "۳۶٫۷",
  },
];
const ROWS = [
  {
    name: "بیت‌کوین",
    sym: "BTC",
    t: "₿",
    c: "#f7931a",
    price: "۳٬۹۰۰٬۰۰۰٬۰۰۰",
    ch: "۳٫۲",
    up: true,
  },
  {
    name: "اتریوم",
    sym: "ETH",
    t: "Ξ",
    c: "#627eea",
    price: "۲۱۰٬۰۰۰٬۰۰۰",
    ch: "۲٫۸",
    up: true,
  },
  {
    name: "تتر",
    sym: "USDT",
    t: "₮",
    c: "#26a17b",
    price: "۵۹٬۸۰۰",
    ch: "۰٫۱",
    up: true,
  },
];

/**
 * A framed preview of the market screen — the hero's product shot. Self-
 * contained sample data (a marketing illustration; the app itself is the real
 * thing). Theme-aware via tokens, so it stays correct in dark mode.
 */
export function MarketPreview() {
  return (
    <div
      dir="rtl"
      aria-hidden
      className="w-[278px] shrink-0 overflow-hidden rounded-[36px] border-[7px] border-brand bg-paper shadow-[0_40px_80px_-24px_rgba(15,35,80,0.4)]"
    >
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-4 pb-2.5 pt-3.5">
        <span className="text-[15px] font-extrabold text-brand">ناخدا</span>
        <SearchIcon size={17} className="text-muted" />
      </div>

      <div className="flex flex-col gap-3.5 px-4 pb-4 pt-3.5">
        {/* balance */}
        <div className="flex items-center justify-between rounded-field border border-line bg-surface px-3 py-2.5">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand text-[14px] font-extrabold text-white">
              ت
            </span>
            <span className="flex flex-col">
              <span className="text-[12px] font-bold text-ink">
                موجودی تومانی
              </span>
              <span className="text-[10px] text-muted">قابل خرید</span>
            </span>
          </span>
          <span
            dir="ltr"
            className="text-[13px] font-extrabold tabular-nums text-ink"
          >
            ۲۵٬۰۰۰٬۰۰۰
          </span>
        </div>

        {/* search */}
        <div className="flex h-9 items-center gap-2 rounded-full bg-surface px-3.5 text-[12px] text-placeholder">
          <SearchIcon size={15} />
          جستجوی رمزارز…
        </div>

        {/* spotlight */}
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
            <span className="size-1.5 rounded-full bg-brand" />
            بیشترین رشد
          </span>
          <div className="flex gap-2 overflow-hidden">
            {GAINERS.map((g) => (
              <div
                key={g.sym}
                className="flex w-[108px] shrink-0 flex-col gap-2 rounded-field bg-surface p-2.5"
              >
                <span className="flex items-center gap-1.5">
                  <Badge t={g.t} c={g.c} size={22} />
                  <span className="text-[11px] font-bold text-ink">
                    {g.sym}
                  </span>
                </span>
                <MiniSpark symbol={g.sym} up width={88} height={26} />
                <span className="flex flex-col items-start gap-0.5">
                  <span
                    dir="ltr"
                    className="text-[11px] font-extrabold tabular-nums text-ink"
                  >
                    {g.price}
                  </span>
                  <span className="rounded-full bg-gain-soft px-1.5 py-0.5 text-[9px] font-extrabold text-gain">
                    ▲ {g.ch}٪
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* rows */}
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
            <span className="size-1.5 rounded-full bg-brand" />
            همه ارزها
          </span>
          {ROWS.map((r) => (
            <div
              key={r.sym}
              className="grid grid-cols-[1fr_46px_auto] items-center gap-2 py-2"
            >
              <span className="flex items-center gap-2">
                <Badge t={r.t} c={r.c} size={30} />
                <span className="flex flex-col">
                  <span className="text-[12px] font-bold text-ink">
                    {r.name}
                  </span>
                  <span dir="ltr" className="text-[10px] text-muted">
                    {r.sym}
                  </span>
                </span>
              </span>
              <MiniSpark symbol={r.sym} up={r.up} width={46} height={20} />
              <span className="flex flex-col items-end gap-0.5">
                <span
                  dir="ltr"
                  className="text-[11px] font-bold tabular-nums text-ink"
                >
                  {r.price}
                </span>
                <span className="text-[10px] font-bold text-gain">
                  ▲ {r.ch}٪
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
