import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ContainerProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** Centered, responsive content width with mobile-first horizontal padding. */
export function Container({
  as: Tag = "div",
  className,
  children,
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[var(--container-page)] px-5 sm:px-8 lg:px-10",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
