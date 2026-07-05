"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FingerprintIcon } from "@/components/ui/icons";
import {
  hasBiometricCredential,
  isBiometricAvailable,
  registerBiometric,
  removeBiometricCredential,
} from "@/lib/utils/webauthn";

/**
 * Biometric enrollment on the two-step settings page (issue #67). Rendered
 * only when the two-step password is set — the biometric is an ALTERNATIVE
 * unlock for the gate, never a replacement for having a password. Hidden
 * entirely on devices without a platform authenticator.
 */
export function BiometricSection({ userName }: { userName: string }) {
  const [available, setAvailable] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    isBiometricAvailable().then((ok) => {
      if (!alive) return;

      setAvailable(ok);
      setEnrolled(hasBiometricCredential());
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!available) return null;

  return (
    <div className="flex flex-col gap-3 rounded-card bg-surface p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-field bg-brand/10 text-brand"
        >
          <FingerprintIcon size={20} />
        </span>
        <div className="flex flex-col">
          <span className="text-[15px] font-bold text-ink">
            ورود با اثر انگشت / چهره
          </span>
          <span className="text-[12px] text-muted">
            {enrolled
              ? "روی این دستگاه فعال است."
              : "به‌جای تایپ رمز، با بیومتریک دستگاه وارد شوید."}
          </span>
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-loss">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        size="lg"
        fullWidth
        variant={enrolled ? "ghost" : "primary"}
        className={enrolled ? "bg-paper text-loss" : undefined}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            if (enrolled) {
              removeBiometricCredential();
              setEnrolled(false);
              return;
            }
            const ok = await registerBiometric(userName);
            if (!ok) {
              setError("فعال‌سازی انجام نشد. دوباره تلاش کنید.");
              return;
            }
            setEnrolled(true);
          })
        }
      >
        {pending
          ? "لطفاً صبر کنید…"
          : enrolled
            ? "غیرفعال‌سازی روی این دستگاه"
            : "فعال‌سازی بیومتریک"}
      </Button>
    </div>
  );
}
