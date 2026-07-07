"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "./button";

/**
 * A load-failure block with a working retry (re-runs the server render) and an
 * optional recovery action — so a failed screen offers a next step instead of a
 * dead paragraph. Used across the market, wallet, and trade surfaces.
 */
export function LoadError({
  message,
  action,
}: {
  message: string;
  action?: { label: string; href: string };
}) {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="max-w-[300px] text-[15px] leading-[1.9] text-muted">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="md" onClick={() => router.refresh()}>
          تلاش مجدد
        </Button>
        {action ? (
          <Link
            href={action.href}
            className={buttonClasses({ variant: "ghost", size: "md" })}
          >
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
