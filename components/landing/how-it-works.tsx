import { Container } from "@/components/ui/container";
import { toPersianDigits } from "@/lib/utils/digits";

/**
 * «سه قدم» — the plain-language promise that you need zero crypto knowledge.
 * Enter a number, pay in Toman, own the coin onchain. Rendered as a connected
 * numbered path (not a card grid) so it reads as a journey and breaks up the
 * page rhythm.
 */
const STEPS = [
  {
    title: "شماره‌ات رو بده",
    description:
      "با شماره موبایل، کمتر از یک دقیقه ثبت‌نام کن. نه کیف پولی می‌سازی، نه چیزی نصب می‌کنی.",
  },
  {
    title: "تومان بده",
    description:
      "مبلغ رو به تومان بپرداز. کارِ پیچیده‌ی زنجیره پشت صحنه با ناخداست.",
  },
  {
    title: "صاحبش شو",
    description:
      "توکن همون لحظه روی زنجیره برات خریده می‌شه. به سادگیِ خریدِ شارژ تلفن.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-linear-to-b from-transparent via-brand/[0.04] to-transparent">
      <Container className="py-20 lg:py-24">
        <div className="mx-auto mb-16 max-w-[640px] text-center">
          <h2 className="mb-3.5 text-[30px] font-extrabold text-ink sm:text-[36px]">
            سه قدم تا اولین میم‌کوینت
          </h2>
          <p className="text-[16px] leading-[1.8] text-muted sm:text-[17px]">
            نه کیف پول، نه رمز خصوصی، نه کارمزد شبکه. کارِ زنجیره با ماست؛ تو
            فقط انتخاب کن و بزن بخر.
          </p>
        </div>

        {/* A connected path: big numbered nodes on a dashed line. The paper ring
            around each node masks the line so it reads as segments between them.
            Horizontal on desktop, a vertical timeline on mobile. */}
        <ol className="relative mx-auto grid max-w-[920px] gap-12 sm:grid-cols-3 sm:gap-6">
          <span
            aria-hidden
            className="absolute right-[16%] left-[16%] top-9 hidden border-t-2 border-dashed border-brand/25 sm:block"
          />
          <span
            aria-hidden
            className="absolute bottom-6 top-6 right-9 border-r-2 border-dashed border-brand/25 sm:hidden"
          />
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex items-start gap-5 sm:flex-col sm:items-center sm:text-center"
            >
              <span className="grid size-[72px] shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-brand/70 text-[28px] font-black tabular-nums text-white shadow-[0_16px_34px_-12px_var(--color-brand)] ring-8 ring-paper">
                {toPersianDigits(i + 1)}
              </span>
              <div className="pt-2 sm:pt-5">
                <h3 className="mb-2 text-[21px] font-extrabold text-ink">
                  {step.title}
                </h3>
                <p className="max-w-[260px] text-[15px] leading-[1.85] text-muted">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
