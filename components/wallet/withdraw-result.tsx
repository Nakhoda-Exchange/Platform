import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { CheckCircleIcon } from "@/components/ui/icons";

/** Withdrawal receipt: the request is registered and stays pending for review. */
export function WithdrawResult({ summary }: { summary: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <CheckCircleIcon size={64} className="text-brand" />
      <div className="flex flex-col gap-2">
        <h2 className="text-[22px] font-extrabold text-ink">
          درخواست برداشت ثبت شد
        </h2>
        <p className="text-[16px] leading-7 text-muted">{summary}</p>
        <p className="text-[14px] text-muted">
          برداشت‌ها پس از بررسی انجام می‌شوند؛ وضعیت را از تاریخچه دنبال کنید.
        </p>
      </div>
      <div className="flex w-full max-w-[360px] flex-col gap-3">
        <Link
          href="/wallet/history"
          className={buttonClasses({ size: "lg", fullWidth: true })}
        >
          مشاهده تاریخچه
        </Link>
        <Link
          href="/wallet"
          className={buttonClasses({
            variant: "ghost",
            size: "lg",
            fullWidth: true,
          })}
        >
          بازگشت به کیف پول
        </Link>
      </div>
    </div>
  );
}
