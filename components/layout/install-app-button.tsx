"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { SmartphoneIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

/** True on touch devices. SSR-safe (assumes desktop until the client mounts). */
function useCoarsePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );
}

/**
 * The «موبایل» icon in the site header.
 *
 * On a phone there's nothing to scan — a tap just opens the platform (/market).
 * On desktop, hover or click reveals a QR that points at this same origin, so
 * scanning it opens the site on the visitor's phone (where the PWA install
 * prompt lives). The QR is generated client-side from `location.origin`, so it
 * always encodes whatever host the page is actually served from.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const router = useRouter();
  const isMobile = useCoarsePointer();
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  // Load the QR once, lazily (qrcode is chunked out of the landing bundle).
  useEffect(() => {
    if (isMobile || qr) return;
    let cancelled = false;
    import("qrcode").then((m) =>
      m.default
        .toString(window.location.origin, {
          type: "svg",
          margin: 0,
          color: { dark: "#1a1b1e", light: "#ffffff" },
        })
        .then((svg) => {
          if (!cancelled) setQr(svg);
        })
        .catch(() => {}),
    );
    return () => {
      cancelled = true;
    };
  }, [isMobile, qr]);

  if (isMobile) {
    return (
      <button
        type="button"
        aria-label="باز کردن پلتفرم"
        onClick={() => router.push("/market")}
        className={cn("shrink-0", className)}
      >
        <SmartphoneIcon size={20} />
      </button>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="نصب اپلیکیشن با اسکن کد"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn("shrink-0", open && "text-ink", className)}
      >
        <SmartphoneIcon size={20} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="نصب اپلیکیشن"
          className="absolute end-0 top-full z-50 mt-3 flex w-60 flex-col items-center gap-3 rounded-card border border-line bg-paper p-4 shadow-xl"
        >
          {qr ? (
            <div
              role="img"
              aria-label="کد QR برای باز کردن سایت روی موبایل"
              className="w-40 rounded-card border border-line bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          ) : (
            <div className="aspect-square w-40 animate-pulse rounded-card border border-line bg-surface" />
          )}
          <p className="text-center text-[13px] leading-6 text-muted">
            برای نصب اپلیکیشن، این کد را با دوربین موبایل اسکن کنید.
          </p>
        </div>
      )}
    </div>
  );
}
