import { Container } from "@/components/ui/container";
import { ShieldIcon } from "@/components/ui/icons";
import { FEATURES } from "./features";

/** «چرا ناخدا؟» — three punchy value props, funky but plain-spoken. */
export function WhyNakhoda() {
  return (
    <Container className="py-20 lg:py-24">
      <div className="mx-auto mb-12 max-w-[640px] text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/5 px-4 py-2 text-[13px] font-bold text-brand">
          <ShieldIcon size={15} />
          خیالت راحت
        </span>
        <h2 className="mb-3.5 text-[30px] font-extrabold text-ink sm:text-[36px]">
          چرا ناخدا؟
        </h2>
        <p className="text-[16px] leading-[1.8] text-muted sm:text-[17px]">
          ساده‌ترین راه برای خرید میم‌کوین با تومان — بی‌آنکه لازم باشه چیزی از
          کریپتو بدونی.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-[28px] bg-paper/80 p-7 shadow-[0_20px_50px_-28px_rgba(15,35,80,0.45)] ring-1 ring-line backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1.5"
          >
            <span className="mb-5 flex size-14 items-center justify-center rounded-[20px] bg-linear-to-br from-brand/15 to-brand/5 text-brand">
              <Icon size={26} />
            </span>
            <h3 className="mb-2 text-[20px] font-extrabold leading-tight text-ink">
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
