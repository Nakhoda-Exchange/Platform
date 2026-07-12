import { MiniSpark } from "./mini-spark";

const TICKER = [
  {
    sym: "BTC",
    t: "₿",
    c: "#f7931a",
    price: "۳٬۹۰۰٬۰۰۰٬۰۰۰",
    ch: "۳٫۲",
    up: true,
  },
  {
    sym: "ETH",
    t: "Ξ",
    c: "#627eea",
    price: "۲۱۰٬۰۰۰٬۰۰۰",
    ch: "۲٫۸",
    up: true,
  },
  { sym: "TON", t: "T", c: "#0098ea", price: "۳۲۰٬۰۰۰", ch: "۳۶٫۷", up: true },
  {
    sym: "SOL",
    t: "S",
    c: "#9945ff",
    price: "۸٬۳۰۰٬۰۰۰",
    ch: "۱۴٫۵",
    up: true,
  },
  {
    sym: "BNB",
    t: "B",
    c: "#f0b90b",
    price: "۴۵٬۰۰۰٬۰۰۰",
    ch: "۱٫۹",
    up: false,
  },
  { sym: "XRP", t: "X", c: "#23292f", price: "۴۲٬۰۰۰", ch: "۴٫۱", up: true },
  { sym: "DOGE", t: "Ð", c: "#c2a633", price: "۴٬۵۰۰", ch: "۲٫۱", up: false },
  { sym: "LINK", t: "L", c: "#2a5ada", price: "۸۴۰٬۰۰۰", ch: "۵٫۱", up: true },
  { sym: "SUI", t: "S", c: "#4da2ff", price: "۶۶٬۰۰۰", ch: "۱۱٫۲", up: true },
  {
    sym: "AVAX",
    t: "A",
    c: "#e84142",
    price: "۱٬۶۷۵٬۰۰۰",
    ch: "۷٫۸",
    up: true,
  },
];

/** One copy of the strip. `pe-9` gives it a trailing gap that matches the
 *  internal `gap-9`, so two copies tile edge-to-edge and the −50% shift lands
 *  exactly one copy over — no half-gap hitch at the seam. */
function Strip() {
  return (
    <div className="flex shrink-0 gap-9 pe-9">
      {TICKER.map((c, i) => (
        <span key={i} className="flex items-center gap-2.5 whitespace-nowrap">
          <span
            className="flex size-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
            style={{ background: c.c }}
          >
            {c.t}
          </span>
          <span dir="ltr" className="text-[14px] font-extrabold text-ink">
            {c.sym}
          </span>
          <MiniSpark symbol={c.sym} up={c.up} width={44} height={18} />
          <span dir="ltr" className="text-[13px] tabular-nums text-muted">
            {c.price}
          </span>
          <span
            dir="ltr"
            className={
              "text-[12px] font-extrabold " + (c.up ? "text-gain" : "text-loss")
            }
          >
            {c.ch}٪
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * The market horizon — a slow, continuous drift of coin prices and sparklines,
 * like a captain's instrument reading the seas. Two identical copies tile so
 * the −50% loop is seamless; reduced-motion holds it still. Decorative sample
 * data (the app is the real thing), so it's aria-hidden — no fake prices read
 * aloud, no phantom landmark.
 */
export function MarketTicker() {
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-line bg-surface py-3.5"
    >
      <div className="flex w-max animate-ticker">
        <Strip />
        <Strip />
      </div>
    </div>
  );
}
