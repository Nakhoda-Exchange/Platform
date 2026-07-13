import { Container } from "@/components/ui/container";
import { PhoneCtaCard } from "./phone-cta-card";

/** A floating coin sticker for the closing band. Decorative. */
function BandCoin({
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
      className={`animate-bob pointer-events-none absolute ${className}`}
      style={{ ["--r" as string]: `${r}deg`, animationDelay: `${delay}s` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover ring-4 ring-white/20"
      />
    </span>
  );
}

/** Big closing call — a bold brand band with floating coins and the phone CTA. */
export function AboardBand() {
  return (
    <Container className="py-12 lg:py-16">
      <div className="relative overflow-hidden rounded-[40px] bg-linear-to-br from-brand via-brand to-brand/80 px-6 py-16 text-center text-white sm:py-20">
        {/* Soft white glow blobs inside the band for gentle depth. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-10 size-56 rounded-full bg-white/15 blur-[70px]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-12 right-0 size-64 rounded-full bg-white/10 blur-[80px]"
        />
        <BandCoin
          icon="/coins/pepe.png"
          size={64}
          r={-12}
          delay={0}
          className="left-[8%] top-[16%] hidden sm:block"
        />
        <BandCoin
          icon="/coins/wif.png"
          size={52}
          r={10}
          delay={0.7}
          className="left-[14%] bottom-[14%] hidden sm:block"
        />
        <BandCoin
          icon="/coins/doge.png"
          size={56}
          r={-8}
          delay={1.2}
          className="right-[9%] top-[20%] hidden sm:block"
        />
        <BandCoin
          icon="/coins/bome.png"
          size={44}
          r={14}
          delay={0.4}
          className="right-[15%] bottom-[16%] hidden sm:block"
        />

        <h2 className="relative mb-3 text-[32px] font-black leading-tight sm:text-[40px]">
          معطلِ چی هستی؟
        </h2>
        <p className="relative mx-auto mb-8 max-w-[420px] text-[16px] text-white/85 sm:text-[17px]">
          ثبت‌نام مجانیه و یه دقیقه‌م نمی‌شه. شماره‌ات رو بده و سوار شو!
        </p>
        {/* The CTA sits on a paper card so its brand button keeps contrast on
            the brand band. */}
        <div className="relative mx-auto w-full max-w-[420px] rounded-card bg-paper p-5 text-right shadow-2xl">
          <PhoneCtaCard />
        </div>
      </div>
    </Container>
  );
}
