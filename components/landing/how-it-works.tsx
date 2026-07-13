import { Container } from "@/components/ui/container";
import {
  CreditCardIcon,
  RocketIcon,
  SmartphoneIcon,
} from "@/components/ui/icons";
import { toPersianDigits } from "@/lib/utils/digits";

/**
 * «سه قدم» — the plain-language promise that you need zero crypto knowledge.
 * Enter a number, pay in Toman, own the coin onchain. Nakhoda handles the
 * wallet, the routing, and the network fees. Big, toylike, one-two-three.
 */
const STEPS = [
  {
    icon: SmartphoneIcon,
    title: "شماره‌ات رو بده",
    description:
      "با شماره موبایل، کمتر از یک دقیقه ثبت‌نام کن. نه کیف پولی می‌سازی، نه چیزی نصب می‌کنی.",
  },
  {
    icon: CreditCardIcon,
    title: "تومان بده",
    description:
      "مبلغ رو به تومان بپرداز. کارِ پیچیده‌ی زنجیره پشت صحنه با ناخداست.",
  },
  {
    icon: RocketIcon,
    title: "صاحبش شو",
    description:
      "توکن همون لحظه روی زنجیره برات خریده می‌شه. به سادگیِ خریدِ شارژ تلفن.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-linear-to-b from-transparent via-brand/[0.04] to-transparent">
      <Container className="py-20 lg:py-24">
        <div className="mx-auto mb-14 max-w-[640px] text-center">
          <h2 className="mb-3.5 text-[30px] font-extrabold text-ink sm:text-[36px]">
            سه قدم تا اولین میم‌کوینت
          </h2>
          <p className="text-[16px] leading-[1.8] text-muted sm:text-[17px]">
            نه کیف پول، نه رمز خصوصی، نه کارمزد شبکه. کارِ زنجیره با ماست؛ تو
            فقط انتخاب کن و بزن بخر.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="relative overflow-hidden rounded-[28px] bg-paper/80 p-8 shadow-[0_24px_60px_-30px_rgba(15,35,80,0.45)] ring-1 ring-line backdrop-blur-sm"
            >
              {/* Oversized, playful step number bleeding off the corner. */}
              <span className="pointer-events-none absolute -left-2 -top-4 select-none text-[110px] font-black leading-none text-brand/[0.07] tabular-nums">
                {toPersianDigits(i + 1)}
              </span>
              <span className="relative mb-5 flex size-14 items-center justify-center rounded-[20px] bg-linear-to-br from-brand to-brand/70 text-white shadow-[0_16px_32px_-12px_var(--color-brand)]">
                <Icon size={26} />
              </span>
              <h3 className="relative mb-2 text-[21px] font-extrabold text-ink">
                {title}
              </h3>
              <p className="relative text-[15px] leading-[1.85] text-muted">
                {description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
