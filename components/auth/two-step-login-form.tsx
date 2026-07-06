"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { passTwoStepBiometric, verifyTwoStepLogin } from "@/app/actions/auth";
import { initialAuthFormState } from "@/app/actions/auth-state";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FingerprintIcon } from "@/components/ui/icons";
import {
  authenticateBiometric,
  hasBiometricCredential,
} from "@/lib/utils/webauthn";

/**
 * The login gate: the two-step password, asked after the OTP. Devices with an
 * enrolled WebAuthn credential get a biometric button first (issue #67); the
 * password stays as the universal fallback.
 */
export function TwoStepLoginForm({
  status,
  nextPath,
}: {
  status: string;
  nextPath?: string;
}) {
  const [password, setPassword] = useState("");
  const [biometric, setBiometric] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [bioPending, startBiometric] = useTransition();
  const [state, formAction, pending] = useActionState(
    verifyTwoStepLogin,
    initialAuthFormState,
  );

  // Enrollment is device-local (localStorage) — readable only after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only read
    setBiometric(hasBiometricCredential());
  }, []);

  const unlock = () =>
    startBiometric(async () => {
      setBiometricError(null);
      const ok = await authenticateBiometric();
      if (!ok) {
        setBiometricError("تأیید بیومتریک انجام نشد. از رمز استفاده کنید.");
        return;
      }
      await passTwoStepBiometric(status, nextPath);
    });

  return (
    <div className="flex w-full flex-col gap-6">
      {biometric ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="xl"
            shape="rounded"
            fullWidth
            variant="ghost"
            className="border border-line bg-surface"
            disabled={bioPending}
            onClick={unlock}
          >
            <FingerprintIcon size={22} />
            {bioPending ? "در حال تأیید…" : "ورود با اثر انگشت / چهره"}
          </Button>
          {biometricError ? (
            <p role="alert" className="text-center text-[13px] text-loss">
              {biometricError}
            </p>
          ) : null}
          <div className="flex items-center gap-3 py-1" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            <span className="text-[12px] text-muted">یا با رمز</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      ) : null}

      <form action={formAction} className="flex w-full flex-col gap-8">
        <input type="hidden" name="st" value={status} />
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <Field
          name="password"
          type="password"
          label="رمز دومرحله‌ای"
          dir="ltr"
          autoComplete="current-password"
          autoFocus={!biometric}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={state.error}
        />
        <div className="flex w-full flex-col items-center gap-4">
          <Button
            type="submit"
            size="xl"
            shape="rounded"
            fullWidth
            disabled={password.length === 0 || pending}
          >
            {pending ? "لطفاً صبر کنید…" : "ورود"}
          </Button>
          <Link
            href={`/login/two-step/reset?st=${encodeURIComponent(status)}`}
            className="text-[14px] font-bold text-brand"
          >
            رمز را فراموش کرده‌اید؟
          </Link>
        </div>
      </form>
    </div>
  );
}
