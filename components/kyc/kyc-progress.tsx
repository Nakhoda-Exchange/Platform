import { cn } from "@/lib/utils/cn";

/**
 * Two-segment KYC step indicator. In the RTL layout the first segment renders on
 * the right, so step 1 fills the right half and step 2 fills both.
 */
export function KycProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex w-full gap-2" aria-hidden>
      <span className="h-1.5 flex-1 rounded-full bg-brand" />
      <span
        className={cn(
          "h-1.5 flex-1 rounded-full",
          step >= 2 ? "bg-brand" : "bg-line",
        )}
      />
    </div>
  );
}
