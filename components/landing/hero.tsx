import { Container } from "@/components/ui/container";
import { PhoneCtaCard } from "./phone-cta-card";
import { Blobs } from "./blobs";

/**
 * A coin sticker that bounces in place. Decorative — real logos are the one
 * sanctioned exception to the blue-only palette (see CoinIcon). Sits in a soft
 * squishy ring; `r` tilts it and `delay` desyncs the bounce so no two match.
 */
function FloatingCoin({
  icon,
  className,
  size,
  r = 0,
  delay = 0,
}: {
  icon: string;
  className: string;
  size: number;
  r?: number;
  delay?: number;
}) {
  return (
    <span
      aria-hidden
      className={`animate-bob pointer-events-none absolute grid place-items-center rounded-full bg-paper/70 shadow-[0_20px_45px_-15px_rgba(15,35,80,0.45)] ring-1 ring-line backdrop-blur-sm ${className}`}
      style={{
        ["--r" as string]: `${r}deg`,
        animationDelay: `${delay}s`,
        padding: size * 0.16,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    </span>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-brand/10 via-paper to-paper dark:from-brand/20">
      <Blobs />

      {/* Bouncy meme coins orbit the type from sm up; hidden on the smallest
          screens so they never crowd the headline. */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        <FloatingCoin
          icon="/coins/pepe.png"
          size={64}
          r={-10}
          delay={0}
          className="left-[6%] top-[22%]"
        />
        <FloatingCoin
          icon="/coins/sol.png"
          size={40}
          r={8}
          delay={1.3}
          className="left-[24%] top-[13%]"
        />
        <FloatingCoin
          icon="/coins/doge.png"
          size={54}
          r={12}
          delay={0.6}
          className="left-[13%] top-[62%]"
        />
        <FloatingCoin
          icon="/coins/wif.png"
          size={60}
          r={-6}
          delay={1.1}
          className="right-[6%] top-[24%]"
        />
        <FloatingCoin
          icon="/coins/mew.png"
          size={42}
          r={-14}
          delay={0.9}
          className="right-[24%] top-[13%]"
        />
        <FloatingCoin
          icon="/coins/bome.png"
          size={46}
          r={14}
          delay={1.6}
          className="right-[13%] top-[63%]"
        />
      </div>

      <Container className="relative">
        <div className="mx-auto flex max-w-[680px] flex-col items-center py-20 text-center lg:py-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-paper/70 px-4 py-2 text-[13px] font-bold text-brand shadow-[0_8px_24px_-12px_rgba(15,35,80,0.4)] ring-1 ring-line backdrop-blur">
            🌊 سوار موجِ میم‌کوین‌ها شو
          </span>

          <h1 className="mb-5 text-[44px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[60px] lg:text-[72px]">
            میم‌کوین؟
            <br />
            با{" "}
            <span className="bg-linear-to-l from-brand to-brand/70 bg-clip-text text-transparent">
              تومان
            </span>{" "}
            بخر!
          </h1>

          <p className="mb-8 max-w-[520px] text-[17px] leading-[1.9] text-muted sm:text-[19px]">
            پپه، داگ، وایف و صدها توکنِ دیگه — شماره‌ات رو بده، با تومان پرداخت
            کن، و همون لحظه صاحبش شو. نه کیف پول، نه رمز خصوصی، نه دردسر.
          </p>

          {/* Squishy CTA card floating on the soft gradient. */}
          <div className="w-full max-w-[440px] rounded-[28px] bg-paper/80 p-5 shadow-[0_30px_70px_-30px_rgba(15,35,80,0.5)] ring-1 ring-line backdrop-blur-sm">
            <PhoneCtaCard />
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {["بدون کیف پول", "بدون رمز خصوصی", "پرداخت با تومان"].map(
                (t) => (
                  <li
                    key={t}
                    className="rounded-full bg-brand/5 px-3 py-1.5 text-[12px] font-semibold text-muted"
                  >
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
