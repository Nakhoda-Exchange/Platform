import { cn } from "@/lib/utils/cn";

const CAPTION: Record<1 | 2, string> = {
  1: "قدم ۱ از ۲ — اطلاعات هویتی",
  2: "قدم ۲ از ۲ — تأیید نهایی",
};

/**
 * Two-segment KYC step indicator with a caption, so the user knows how far
 * along they are and how much is left. In the RTL layout the first segment
 * renders on the right, so step 1 fills the right half and step 2 fills both.
 */
export function KycProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full gap-2" aria-hidden>
        <span className="h-1.5 flex-1 rounded-full bg-brand" />
        <span
          className={cn(
            "h-1.5 flex-1 rounded-full",
            step >= 2 ? "bg-brand" : "bg-line",
          )}
        />
      </div>
      <span className="text-[12px] font-medium text-muted">
        {CAPTION[step]}
      </span>
    </div>
  );
}
