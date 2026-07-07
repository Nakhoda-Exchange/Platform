import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";

/**
 * Shared empty/first-time state for the wallet tabs (nothing to withdraw yet,
 * no coins to send, …): a brand medallion, a short reason, and the one action
 * that unblocks the user. Keeps deposit/withdraw tabs consistent instead of
 * each rolling its own centered paragraph.
 */
export function WalletEmpty({
  icon,
  title,
  message,
  cta,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
        {icon}
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="text-[17px] font-bold text-ink">{title}</h2>
        <p className="max-w-[300px] text-[14px] leading-[1.9] text-muted">
          {message}
        </p>
      </div>
      {cta ? (
        <Link href={cta.href} className={buttonClasses({ size: "lg" })}>
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}
