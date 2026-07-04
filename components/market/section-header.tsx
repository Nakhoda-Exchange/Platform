import type { ReactNode } from "react";

/** Section title with a leading brand icon (RTL: title right, icon to its left). */
export function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-[17px] font-bold text-ink">{title}</h2>
      <span className="text-brand">{icon}</span>
    </div>
  );
}
