import { CoinIcon } from "@/components/market/coin-icon";
import { Logo } from "@/components/layout/logo";
import {
  BellIcon,
  HeadphonesIcon,
  RocketIcon,
  SearchIcon,
  StarIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

/** A gainer chip for the «بیشترین رشد» strip — meme coins lead. */
const GAINERS = [
  { sym: "WIF", icon: "/coins/wif.png", ch: "۴۲٫۳" },
  { sym: "BOME", icon: "/coins/bome.png", ch: "۶۳٫۵" },
  { sym: "PEPE", icon: "/coins/pepe.png", ch: "۲۸٫۱" },
];

/** «علاقه‌مندی‌ها» rows. */
const ROWS = [
  {
    name: "پپه",
    sym: "PEPE",
    icon: "/coins/pepe.png",
    price: "۰٫۶۸",
    ch: "۲۸٫۱",
    up: true,
  },
  {
    name: "داگ‌کوین",
    sym: "DOGE",
    icon: "/coins/doge.png",
    price: "۴٬۵۰۰",
    ch: "۲٫۱",
    up: false,
  },
  {
    name: "داگ‌ویف‌هت",
    sym: "WIF",
    icon: "/coins/wif.png",
    price: "۱۴۰٬۰۰۰",
    ch: "۴۲٫۳",
    up: true,
  },
];

/**
 * A framed shot of the market screen — built from the SAME primitives the app
 * uses (real CoinIcon logos, the shared Logo, the design tokens), so it mirrors
 * the live UI and follows the theme in both light and dark. Decorative
 * (aria-hidden); the app itself is the real thing.
 */
export function MarketPreview() {
  return (
    <div
      dir="rtl"
      aria-hidden
      className="w-[300px] shrink-0 overflow-hidden rounded-[38px] border-[8px] border-ink/10 bg-paper shadow-[0_40px_90px_-30px_rgba(15,35,80,0.45)]"
    >
      {/* header */}
      <div className="flex items-center justify-between border-b border-line px-4 pb-3 pt-4">
        <Logo size={15} href={null} />
        <span className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-field bg-surface text-muted">
            <HeadphonesIcon size={16} />
          </span>
          <span className="flex size-8 items-center justify-center rounded-field bg-surface text-muted">
            <BellIcon size={16} />
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-3.5 px-4 pb-5 pt-4">
        {/* balance */}
        <div className="flex items-center justify-between rounded-field border border-line bg-surface px-3 py-2.5">
          <span className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coins/irt.png"
              alt=""
              width={30}
              height={30}
              className="size-[30px] rounded-full object-cover"
            />
            <span className="flex flex-col">
              <span className="text-[13px] font-bold text-ink">تومان</span>
              <span className="text-[10px] text-muted">موجودی</span>
            </span>
          </span>
          <span
            dir="ltr"
            className="text-[13px] font-extrabold tabular-nums text-ink"
          >
            ۲۵۰٬۰۰۰٬۰۰۰
          </span>
        </div>

        {/* search */}
        <div className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[12px] text-placeholder">
          <SearchIcon size={15} />
          جستجوی رمزارز…
        </div>

        {/* gainers */}
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 self-end text-[13px] font-extrabold text-ink">
            بیشترین رشد
            <RocketIcon size={15} className="text-brand" />
          </span>
          <div className="flex gap-2 overflow-hidden">
            {GAINERS.map((g) => (
              <div
                key={g.sym}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1.5"
              >
                <CoinIcon coin={{ iconUrl: g.icon, symbol: g.sym }} size={18} />
                <span className="text-[11px] font-bold text-ink">{g.sym}</span>
                <span className="text-[11px] font-extrabold text-gain">
                  {g.ch}٪
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* watchlist */}
        <div className="flex flex-col">
          <span className="mb-1 flex items-center gap-1.5 self-end text-[13px] font-extrabold text-ink">
            علاقه‌مندی‌ها
            <StarIcon size={15} className="text-brand" />
          </span>
          {ROWS.map((r, i) => (
            <div
              key={r.sym}
              className={cn(
                "flex items-center gap-2.5 py-2.5",
                i > 0 && "border-t border-line",
              )}
            >
              <CoinIcon coin={{ iconUrl: r.icon, symbol: r.sym }} size={30} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[12px] font-bold text-ink">{r.name}</span>
                <span dir="ltr" className="text-[10px] text-muted">
                  {r.sym}
                </span>
              </span>
              <span
                className={cn(
                  "text-[11px] font-extrabold tabular-nums",
                  r.up ? "text-gain" : "text-loss",
                )}
              >
                {r.ch}٪
              </span>
              <span
                dir="ltr"
                className="whitespace-nowrap text-[11px] font-bold tabular-nums text-ink"
              >
                {r.price} تومان
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
