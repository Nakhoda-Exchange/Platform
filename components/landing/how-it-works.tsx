import { Container } from "@/components/ui/container";
import {
  CreditCardIcon,
  RocketIcon,
  SmartphoneIcon,
} from "@/components/ui/icons";
import { toPersianDigits } from "@/lib/utils/digits";

/**
 * «در سه قدم» — the plain-language promise that you need no crypto knowledge.
 * Enter a number, pay in Toman, own the coin onchain. Nakhoda does the wallet,
 * the routing, and the network fees behind the scenes. Framed for a first-time
 * buyer: "as easy as topping up your phone."
 */
const STEPS = [
  {
    icon: SmartphoneIcon,
    title: "شماره‌ات را وارد کن",
    description:
      "با شماره موبایل، در کمتر از یک دقیقه ثبت‌نام کن. نه کیف پولی می‌سازی، نه چیزی نصب می‌کنی.",
  },
  {
    icon: CreditCardIcon,
    title: "با تومان پرداخت کن",
    description:
      "مبلغ را به تومان بپرداز. ناخدا پشت صحنه، کارِ پیچیده‌ی زنجیره را برایت انجام می‌دهد.",
  },
  {
    icon: RocketIcon,
    title: "توکنت را تحویل بگیر",
    description:
      "توکن همان لحظه روی زنجیره برایت خریده می‌شود. به سادگیِ خریدِ شارژ تلفن.",
  },
];

export function HowItWorks() {
  return (
    <Container className="py-20 lg:py-24">
      <div className="mx-auto mb-12 max-w-[640px] text-center">
        <h2 className="mb-3.5 text-[30px] font-extrabold text-ink sm:text-[36px]">
          در سه قدم، صاحب اولین توکنت شو
        </h2>
        <p className="text-[16px] leading-[1.8] text-muted sm:text-[17px]">
          نه کیف پول، نه رمز خصوصی، نه کارمزد شبکه. کارِ زنجیره با ماست؛ تو فقط
          انتخاب کن و بخر.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <div
            key={title}
            className="relative rounded-card border border-line bg-paper p-7"
          >
            <span className="mb-4 flex size-12 items-center justify-center rounded-field bg-brand/10 text-brand">
              <Icon size={24} />
            </span>
            <span className="absolute left-6 top-7 text-[15px] font-extrabold tabular-nums text-brand/30">
              {toPersianDigits(i + 1)}
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
