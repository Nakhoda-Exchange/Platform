import type { Metadata } from "next";
import { ResetTwoStepForm } from "@/components/account/reset-two-step-form";

export const metadata: Metadata = {
  title: "بازنشانی رمز دومرحله‌ای | ناخدا",
};

export default function TwoStepResetPage() {
  return (
    <div className="flex flex-1 flex-col px-4 pb-6 pt-4">
      <ResetTwoStepForm
        doneHref="/account/two-step"
        doneLabel="بازگشت به تنظیمات"
      />
    </div>
  );
}
