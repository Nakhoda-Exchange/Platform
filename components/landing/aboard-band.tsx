import { Container } from "@/components/ui/container";
import { PhoneCtaCard } from "./phone-cta-card";

/** Closing call: a deep-blue "come aboard" band with the phone CTA. */
export function AboardBand() {
  return (
    <Container className="py-10">
      <div className="relative overflow-hidden rounded-card bg-brand px-6 py-14 text-center text-white">
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 opacity-[0.14]"
          width="200"
          height="200"
          viewBox="0 0 20 20"
          fill="none"
          stroke="#fff"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 5v13M10 5a1.7 1.7 0 100-3.3A1.7 1.7 0 0010 5zM15.8 10.8l1.7-.8a7.5 7.5 0 01-15 0l1.7.8M7.5 9.2h5" />
        </svg>
        <h2 className="relative mb-3 text-[30px] font-extrabold sm:text-[34px]">
          آماده‌ای اولین میم‌کوینت را بخری؟
        </h2>
        <p className="relative mb-7 text-[16px] text-white/85">
          ثبت‌نام رایگان است و کمتر از یک دقیقه طول می‌کشد. با تومان، بی‌دردسر.
        </p>
        {/* The CTA is a flat field + brand button — on the brand band it would
            blend in, so it sits on a paper card here to keep contrast. */}
        <div className="relative mx-auto w-full max-w-[420px] rounded-card bg-paper p-5 text-right shadow-xl">
          <PhoneCtaCard />
        </div>
      </div>
    </Container>
  );
}
