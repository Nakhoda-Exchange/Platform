import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "xl";
export type ButtonShape = "pill" | "rounded";

const base =
  "inline-flex items-center justify-center gap-2 font-bold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand/90 active:bg-brand/95 disabled:bg-line disabled:text-placeholder",
  ghost: "bg-transparent text-ink hover:bg-surface disabled:opacity-60",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-[18px] text-[15px]",
  lg: "h-12 px-6 text-[15px]",
  xl: "h-14 px-6 text-[16px]",
};

const shapes: Record<ButtonShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-[14px]",
};

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Shared class recipe — use directly to make a `next/link` or any element look
 * like a button, keeping all button styling in one place.
 */
export function buttonClasses(options: ButtonStyleOptions = {}): string {
  const {
    variant = "primary",
    size = "md",
    shape = "pill",
    fullWidth = false,
    className,
  } = options;
  return cn(
    base,
    variants[variant],
    sizes[size],
    shapes[shape],
    fullWidth && "w-full",
    className,
  );
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {}

export function Button({
  variant,
  size,
  shape,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, shape, fullWidth, className })}
      {...props}
    />
  );
}
