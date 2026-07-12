import { Container } from "@/components/ui/container";
import { CheckCircleIcon } from "@/components/ui/icons";
import { PhoneCtaCard } from "./phone-cta-card";
import { Waves } from "./waves";
import { MarketPreview } from "./market-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand/[0.06] via-paper to-paper">
      {/* Decorative sea: wave lines + a faint compass rose. */}
      <Waves
        className="right-[-120px] top-6 w-[600px] rotate-[-9deg]"
        opacity={0.06}
      />
      <Waves
        className="left-[-150px] top-52 w-[640px] rotate-[13deg]"
        opacity={0.05}
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 text-brand opacity-[0.05]"
        width="320"
        height="320"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <circle cx="50" cy="50" r="46" />
        <circle cx="50" cy="50" r="34" />
        <path
          d="M50 6 L58 42 L50 50 L42 42 Z M50 94 L42 58 L50 50 L58 58 Z M6 50 L42 42 L50 50 L42 58 Z M94 50 L58 58 L50 50 L58 42 Z"
          fill="currentColor"
          stroke="none"
        />
      </svg>

      <Container className="relative">
        <div className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-10 lg:py-24">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-right">
            <span className="mb-5 inline-flex items-center rounded-full bg-brand/10 px-3 py-1.5 text-[13px] font-extrabold text-brand">
              صرافی آلت‌کوین ایرانی
            </span>
            <h1 className="mb-4 text-[34px] font-extrabold leading-[1.15] text-ink sm:text-[44px] lg:text-[54px]">
              دنیای آلت‌کوین‌ها،
              <br />
              زیر نظر <span className="text-brand">ناخدا</span>.
            </h1>
            <p className="mb-7 max-w-[520px] text-[16px] leading-[1.9] text-muted sm:text-[18px]">
              سکان بازار رمزارز را به دست بگیر. خرید و فروش صدها ارز، سریع و
              ساده — با شماره موبایلت در کمتر از یک دقیقه سوار شو و اولین
              معامله‌ات را انجام بده.
            </p>
            <PhoneCtaCard />
            <p className="mt-3.5 flex items-center gap-1.5 text-[13px] text-muted">
              <CheckCircleIcon size={15} className="text-brand" />
              بدون کارمزد ثبت‌نام · احراز هویت سریع
            </p>
          </div>

          <div className="flex justify-center">
            <MarketPreview />
          </div>
        </div>
      </Container>
    </section>
  );
}
