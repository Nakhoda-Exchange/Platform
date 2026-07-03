import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

interface AuthHeaderProps {
  title: ReactNode;
  /** Plain string is styled automatically; pass a node for richer subtitles. */
  subtitle: ReactNode;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Logo />
      <div className="flex w-full flex-col gap-2 text-right">
        <h1 className="text-[32px] font-extrabold leading-tight text-slate-900">
          {title}
        </h1>
        {typeof subtitle === "string" ? (
          <p className="text-[16px] leading-[1.6] text-slate-500">{subtitle}</p>
        ) : (
          subtitle
        )}
      </div>
    </div>
  );
}
