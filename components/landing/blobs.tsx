import { cn } from "@/lib/utils/cn";

/** One soft, heavily-blurred gradient blob. */
function Blob({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <span
      className={cn(
        "animate-blob absolute rounded-full blur-[80px]",
        className,
      )}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

/**
 * A wash of soft blue gradient blobs that fills its (relative) parent. Purely
 * decorative depth — heavy blur, low opacity, behind everything, aria-hidden.
 * Reuse across landing sections so the whole page shares one soft atmosphere.
 */
export function Blobs({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <Blob
        className="-left-16 -top-10 size-72 bg-brand/30 dark:bg-brand/40"
        delay={0}
      />
      <Blob
        className="right-[-4rem] top-16 size-80 bg-brand/25 dark:bg-brand/35"
        delay={3}
      />
      <Blob
        className="bottom-[-4rem] left-1/3 size-72 bg-brand/20 dark:bg-brand/30"
        delay={6}
      />
    </div>
  );
}
