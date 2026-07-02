import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface IconBadgeProps {
  children: ReactNode;
  className?: string;
}

/** The soft-blue rounded square that houses feature icons. */
export function IconBadge({ children, className }: IconBadgeProps) {
  return (
    <div
      className={cn(
        "flex size-12 items-center justify-center rounded-[var(--radius-field)] bg-brand-soft text-brand",
        className,
      )}
    >
      {children}
    </div>
  );
}
