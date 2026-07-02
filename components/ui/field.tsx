import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  error?: string | null;
  containerClassName?: string;
}

/**
 * A labelled input. Label + control + error message are composed together and
 * wired with a shared id for accessibility.
 */
export function Field({
  label,
  error,
  className,
  containerClassName,
  id,
  ...props
}: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex w-full flex-col gap-2", containerClassName)}>
      <label htmlFor={inputId} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-12 w-full rounded-[var(--radius-field)] border border-line bg-surface px-4 text-[16px] leading-[1.6] text-ink outline-none transition-colors placeholder:text-placeholder focus:border-brand",
          error && "border-red-400 focus:border-red-500",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-[12px] text-red-500">{error}</p> : null}
    </div>
  );
}
