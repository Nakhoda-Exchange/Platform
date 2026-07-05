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
import { cn } from "@/lib/utils/cn";

/**
 * The dedicated biometric page (issue #67): enroll / remove the device's
 * platform authenticator as the alternative unlock for the two-step gate.
 * The page renders this only when the two-step password is set; devices
 * without a platform authenticator get a plain "not supported" note.
 * Enrollment is per-device by nature.
 */
export function BiometricScreen({ userName }: { userName: string }) {
  // null = probing (first client render)
  const [available, setAvailable] = useState<boolean | null>(null);
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span
          aria-hidden
          className={cn(
            "flex size-20 items-center justify-center rounded-full",
            enrolled ? "bg-brand/10 text-brand" : "bg-surface text-muted",
          )}
        >
          <FingerprintIcon size={36} />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-extrabold text-ink">
            ورود با اثر انگشت / چهره
          </h1>
          <p className="max-w-[330px] text-[15px] leading-7 text-muted">
            {available === false
              ? "این دستگاه یا مرورگر از ورود بیومتریک پشتیبانی نمی‌کند. از رمز دومرحله‌ای استفاده کنید."
              : enrolled
                ? "روی این دستگاه فعال است. هنگام ورود، به‌جای تایپ رمز از بیومتریک استفاده می‌شود."
                : "به‌جای تایپ رمز دومرحله‌ای هنگام ورود، با اثر انگشت یا چهره تأیید کنید. رمز شما همیشه به‌عنوان راه جایگزین می‌ماند."}
          </p>
        </div>
      </div>

      {available ? (
        <>
          <ul className="flex flex-col gap-2.5 text-[14px] leading-7 text-muted">
            <li>• بیومتریک فقط روی همین دستگاه فعال می‌شود.</li>
            <li>• اطلاعات بیومتریک هرگز از دستگاه شما خارج نمی‌شود.</li>
            <li>• اگر بیومتریک کار نکرد، رمز دومرحله‌ای همیشه کار می‌کند.</li>
          </ul>

          {error ? (
            <p role="alert" className="text-[14px] font-bold text-loss">
              {error}
            </p>
          ) : null}

          <div className="mt-auto">
            <Button
              type="button"
              size="xl"
              fullWidth
              variant={enrolled ? "ghost" : "primary"}
              className={enrolled ? "bg-surface text-loss" : undefined}
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
        </>
      ) : null}
    </div>
  );
}
