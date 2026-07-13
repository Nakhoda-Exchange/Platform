import { Container } from "@/components/ui/container";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUpIcon,
} from "@/components/ui/icons";
import { MEME_COINS, type LandingCoin } from "./coins";
import { MarketPreview } from "./market-preview";
import { Blobs } from "./blobs";
import { cn } from "@/lib/utils/cn";

/** A squishy sticker card for one coin — big soft-ringed logo, name, change.
 *  Lifts gently on hover for a bouncy, toy-like feel. */
function CoinCard({ coin }: { coin: LandingCoin }) {
  return (
    <div className="flex items-center gap-3 rounded-[24px] bg-paper/80 p-4 shadow-[0_18px_40px_-24px_rgba(15,35,80,0.45)] ring-1 ring-line backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coin.icon}
        alt=""
        width={48}
        height={48}
        className="size-12 shrink-0 rounded-full object-cover ring-4 ring-brand/10"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[16px] font-extrabold text-ink">
          {coin.name}
        </span>
        <span dir="ltr" className="text-[12px] font-semibold text-muted">
          {coin.sym}
        </span>
      </span>
      <span
        className={cn(
          "flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[13px] font-extrabold tabular-nums",
          coin.up ? "bg-gain-soft text-gain" : "bg-loss-soft text-loss",
        )}
      >
        {coin.up ? <ArrowUpIcon size={13} /> : <ArrowDownIcon size={13} />}
        {coin.ch}٪
      </span>
    </div>
  );
}

/**
 * «داغ‌ترین میم‌کوین‌ها» — the fun heart of the page. A soft grid of buyable
 * meme coins next to a peek of the real app. Coin cards are decorative sample
 * data; the app is the truth.
 */
export function MemeShowcase() {
  return (
    <section className="relative overflow-hidden">
      <Blobs />
      <Container className="relative py-20 lg:py-24">
        <div className="mx-auto mb-12 max-w-[640px] text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/5 px-4 py-2 text-[13px] font-bold text-brand">
            <TrendingUpIcon size={15} />
            داغ‌ترین‌ها، همین الان
          </span>
          <h2 className="mb-3.5 text-[30px] font-extrabold text-ink sm:text-[36px]">
            این‌ها رو می‌تونی بخری
          </h2>
          <p className="text-[16px] leading-[1.8] text-muted sm:text-[17px]">
            از پپه و داگ تا تازه‌ترین توکن‌ها — همه با تومان، همه با یک ضربه.
          </p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-14">
          <div className="grid gap-3.5 sm:grid-cols-2" aria-hidden>
            {MEME_COINS.map((coin) => (
              <CoinCard key={coin.sym} coin={coin} />
            ))}
            <div className="flex items-center justify-center rounded-[24px] border border-dashed border-brand/25 bg-brand/[0.04] p-4 text-[15px] font-bold text-muted">
              و صدها توکنِ دیگه…
            </div>
          </div>

          <div className="flex justify-center">
            <MarketPreview />
          </div>
        </div>
      </Container>
    </section>
  );
}
