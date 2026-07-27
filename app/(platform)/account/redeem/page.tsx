import type { Metadata } from "next";
import { RedeemCodeForm } from "@/components/incentives/redeem-code-form";

export const metadata: Metadata = {
  title: "کد هدیه | ناخدا",
};

export default function RedeemPage() {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6">
      <div className="flex w-full flex-col gap-2 text-right">
        <h1 className="text-[22px] font-extrabold leading-tight text-ink">
          کد هدیه یا دعوت
        </h1>
        <p className="text-[15px] leading-[1.7] text-muted">
          اگر کد تشویقی دارید اینجا وارد کنید تا جایزه‌اش به کیف پول شما اضافه
          شود. هر کد برای هر حساب فقط یک‌بار قابل استفاده است.
        </p>
      </div>

      <RedeemCodeForm />
    </div>
  );
}
