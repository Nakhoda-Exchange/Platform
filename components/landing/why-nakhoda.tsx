import { Container } from "@/components/ui/container";
import { FEATURES } from "./features";

/** «چرا با ناخدا؟» — three plain value props, nautically framed. */
export function WhyNakhoda() {
  return (
    <Container className="py-20 lg:py-24">
      <div className="mx-auto mb-12 max-w-[640px] text-center">
        <h2 className="mb-3.5 text-[30px] font-extrabold text-ink sm:text-[36px]">
          چرا با ناخدا؟
        </h2>
        <p className="text-[16px] leading-[1.8] text-muted sm:text-[17px]">
          یک عرشه‌ی مطمئن برای پیمودن بازار پرتلاطم رمزارزها — ساده برای
          تازه‌کارها، سریع برای حرفه‌ای‌ها.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-card border border-line bg-paper p-7"
          >
            <span className="mb-4 flex size-12 items-center justify-center rounded-field bg-brand/10 text-brand">
              <Icon size={24} />
            </span>
            <h3 className="mb-2 text-[19px] font-extrabold text-ink">
              {title}
            </h3>
            <p className="text-[15px] leading-[1.85] text-muted">
              {description}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
}
