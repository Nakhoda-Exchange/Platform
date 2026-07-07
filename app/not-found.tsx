import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

/**
 * Root 404 for unknown public paths (outside the app shell). Localized RTL,
 * with a way back to the home page — never Next's default English page.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-paper px-6 text-center">
      <div className="flex max-w-[320px] flex-col gap-2">
        <h1 className="text-[22px] font-extrabold text-ink">صفحه پیدا نشد</h1>
        <p className="text-[15px] leading-[1.9] text-muted">
          آدرسی که دنبالش بودید وجود ندارد یا جابه‌جا شده است.
        </p>
      </div>
      <Link
        href="/"
        className={buttonClasses({ size: "lg", shape: "rounded" })}
      >
        بازگشت به خانه
      </Link>
    </main>
  );
}
