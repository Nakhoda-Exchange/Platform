import Link from "next/link";
import { Logo } from "./logo";
import { HeadphonesIcon } from "@/components/ui/icons";

/** Authenticated platform header: logo (right in RTL) + support button (left). */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <Logo size={20} href="/market" />
      <Link
        href="#"
        aria-label="پشتیبانی"
        className="flex size-11 items-center justify-center rounded-xl bg-surface text-gray-500 transition-colors hover:bg-gray-100"
      >
        <HeadphonesIcon size={20} />
      </Link>
    </header>
  );
}
