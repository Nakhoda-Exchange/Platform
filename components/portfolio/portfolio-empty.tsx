import Link from "next/link";
import { WalletIcon } from "@/components/ui/icons";
import { buttonClasses } from "@/components/ui/button";

/** Shown when the user has no holdings — nudges them to buy or deposit. */
export function PortfolioEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-brand/10 text-brand">
        <WalletIcon size={44} />
      </span>
      <h2 className="text-[20px] font-extrabold text-ink">
        هنوز دارایی‌ای نداری
      </h2>
      <p className="max-w-[300px] text-[15px] leading-[1.8] text-muted">
        با اولین خرید، سبد دارایی‌ات این‌جا شکل می‌گیرد.
      </p>
      <div className="mt-2 flex w-full max-w-[320px] flex-col gap-2.5">
        <Link
          href="/market"
          className={buttonClasses({ size: "xl", fullWidth: true })}
        >
          خرید رمزارز
        </Link>
        <Link
          href="/wallet/deposit"
          className={buttonClasses({
            variant: "ghost",
            size: "xl",
            fullWidth: true,
            className: "bg-surface",
          })}
        >
          واریز تومان
        </Link>
      </div>
    </div>
  );
}
