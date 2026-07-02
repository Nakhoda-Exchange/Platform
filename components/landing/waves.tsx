import { cn } from "@/lib/utils/cn";

interface WavesProps {
  className?: string;
  opacity?: number;
}

const WAVE_PATH =
  "M49.98 74.9914C64.9812 81.2421 79.9824 87.4929 112.485 87.4929C174.99 87.4929 174.99 62.49 237.495 62.49C302.5 62.49 297.5 87.4929 362.505 87.4929C425.01 87.4929 425.01 62.49 487.515 62.49C520.018 62.49 535.019 68.7407 550.02 74.9914M49.98 150C64.9812 156.251 79.9824 162.501 112.485 162.501C174.99 162.501 174.99 137.499 237.495 137.499C302.5 137.499 297.5 162.501 362.505 162.501C425.01 162.501 425.01 137.499 487.515 137.499C520.018 137.499 535.019 143.749 550.02 150M49.98 225.009C64.9812 231.259 79.9824 237.51 112.485 237.51C174.99 237.51 174.99 212.507 237.495 212.507C302.5 212.507 297.5 237.51 362.505 237.51C425.01 237.51 425.01 212.507 487.515 212.507C520.018 212.507 535.019 218.758 550.02 225.009";

/** Decorative wave lines used behind the hero. Purely presentational. */
export function Waves({ className, opacity = 0.04 }: WavesProps) {
  return (
    <svg
      viewBox="0 0 600 300"
      className={cn("pointer-events-none absolute text-brand", className)}
      style={{ opacity }}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={WAVE_PATH}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}
