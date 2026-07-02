import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[28px] font-extrabold text-ink sm:text-[36px]">
        {title}
      </h1>
      {description ? (
        <p className="max-w-[640px] text-[16px] leading-[1.7] text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
