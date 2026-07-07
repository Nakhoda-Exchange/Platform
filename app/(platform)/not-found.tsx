import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

/**
 * Platform 404 — reached by `notFound()` in the coin/trade routes and any
 * unknown in-app path. Localized RTL, with a way back to the market.
 */
export default function PlatformNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex max-w-[320px] flex-col gap-2">
        <h1 className="text-[20px] font-extrabold text-ink">صفحه پیدا نشد</h1>
        <p className="text-[15px] leading-[1.9] text-muted">
          آدرسی که دنبالش بودید وجود ندارد یا جابه‌جا شده است.
        </p>
      </div>
      <Link href="/market" className={buttonClasses({ size: "md" })}>
        رفتن به بازار
      </Link>
    </div>
  );
}
