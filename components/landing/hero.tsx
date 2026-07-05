import { Container } from "@/components/ui/container";
import { PhoneCtaCard } from "./phone-cta-card";
import { Waves } from "./waves";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-paper">
      {/* decorative background */}
      <Waves
        className="right-[-140px] top-6 w-[560px] rotate-[-10deg] sm:right-[-80px]"
        opacity={0.05}
      />
      <Waves
        className="left-[-160px] top-40 w-[600px] rotate-[15deg] sm:left-[-90px]"
        opacity={0.04}
      />

      <Container className="relative flex min-h-[560px] flex-col items-center justify-center py-20 text-center sm:min-h-[620px] lg:py-28">
        <div className="flex w-full max-w-[800px] flex-col items-center gap-6">
          <h1 className="text-[32px] font-extrabold leading-[1.2] text-ink sm:text-[44px] lg:text-[56px]">
            دنیای آلت‌کوین‌ها، زیر نظر ناخدا.
          </h1>

          <p className="text-[18px] font-semibold text-brand sm:text-[21px] lg:text-[24px]">
            خرید و فروش صدها رمزارز، سریع، ساده و بدون پیچیدگی.
          </p>

          <p className="max-w-[600px] text-[15px] leading-[1.7] text-muted sm:text-[17px] lg:text-[18px]">
            ناخدا تجربه‌ای مدرن برای معامله آلت‌کوین‌ها فراهم کرده است؛ با تمرکز
            بر سرعت، سادگی و دسترسی به رمزارزهای متنوع.
          </p>

          <div className="mt-2 flex w-full justify-center">
            <PhoneCtaCard />
          </div>
        </div>
      </Container>
    </section>
  );
}
