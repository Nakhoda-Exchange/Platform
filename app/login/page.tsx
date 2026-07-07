import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthHeader } from "@/components/auth/auth-header";
import { PhoneLoginForm } from "@/components/auth/phone-login-form";
import { SupportLink } from "@/components/support/support-link";

export const metadata: Metadata = {
  title: "ورود به ناخدا",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; next?: string }>;
}) {
  const { ref, next } = await searchParams;
  return (
    <AuthShell>
      <AuthHeader
        title="ورود به ناخدا"
        subtitle="برای ورود یا ایجاد حساب، شماره موبایل خود را وارد کنید."
      />

      <PhoneLoginForm refCode={ref} nextPath={next} />

      <p className="text-center text-[13px] leading-[1.8] text-muted">
        با ادامه،{" "}
        <Link href="/terms" className="font-semibold text-brand">
          قوانین
        </Link>{" "}
        و{" "}
        <Link href="/privacy" className="font-semibold text-brand">
          حریم خصوصی
        </Link>{" "}
        ناخدا را می‌پذیرید.
      </p>

      <p className="flex items-center justify-center gap-1 pt-5 text-[14px] text-muted">
        <span>مشکلی در ورود دارید؟</span>
        <SupportLink className="font-bold text-brand" />
      </p>
    </AuthShell>
  );
}
