import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

/** Vertical rhythm wrapper for page sections (mobile-first spacing). */
export function Section({ id, className, children }: SectionProps) {
  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-28", className)}>
      {children}
    </section>
  );
}
