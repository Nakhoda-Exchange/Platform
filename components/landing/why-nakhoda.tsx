import { Container } from "@/components/ui/container";
import { FEATURES } from "./features";

/**
 * «چرا ناخدا؟» — an asymmetric split: a start-aligned heading on one side and
 * the value props as stacked rows on the other. Deliberately different from the
 * centered card grids elsewhere so the page doesn't read as one repeated block.
 */
export function WhyNakhoda() {
  return (
    <Container className="py-20 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="mb-3.5 text-[30px] font-extrabold leading-tight text-ink sm:text-[36px] lg:text-[42px]">
            چرا ناخدا؟
          </h2>
          <p className="text-[16px] leading-[1.9] text-muted sm:text-[17px]">
            ساده‌ترین راه برای خرید میم‌کوین با تومان — بی‌آنکه لازم باشه چیزی
            از کریپتو بدونی.
          </p>
        </div>

        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex items-start gap-4 rounded-[24px] bg-paper/80 p-6 shadow-[0_18px_44px_-28px_rgba(15,35,80,0.45)] ring-1 ring-line backdrop-blur-sm transition-transform duration-300 hover:-translate-x-1.5"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-linear-to-br from-brand/15 to-brand/5 text-brand">
                <Icon size={26} />
              </span>
              <div>
                <h3 className="mb-1.5 text-[19px] font-extrabold leading-tight text-ink">
                  {title}
                </h3>
                <p className="text-[15px] leading-[1.85] text-muted">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
