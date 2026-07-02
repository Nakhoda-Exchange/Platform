import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  as?: ElementType;
  className?: string;
  dir?: "rtl" | "ltr";
  children: ReactNode;
}

/** Surface container with the design's 20px radius and hairline border. */
export function Card({ as: Tag = "div", className, dir, children }: CardProps) {
  return (
    <Tag
      dir={dir}
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-white",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
