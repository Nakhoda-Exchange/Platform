"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_TRADE_PREFERENCES,
  RISKY_SLIPPAGE_BPS,
  type TradePreferences,
} from "@/lib/core/domain/trade/preferences";
import { formatSlippagePercent } from "@/lib/utils/money";
import { toPersianDigits } from "@/lib/utils/digits";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";

/** Tolerances worth offering as one tap. The last is deliberately in warning territory. */
const SLIPPAGE_PRESETS = [50, 100, 300, 500] as const;
const CONFIRM_PRESETS = [15, 30, 60] as const;

/**
 * Trade preferences: how much slippage the user accepts, and how long the
 * confirm sheet stays valid.
 *
 * The slippage setting is a genuine FULL OVERRIDE of the per-coin tolerance the
 * exchange configured — the user's money is at stake, so their explicit choice
 * wins. That makes the warning above {@link RISKY_SLIPPAGE_BPS} the important
 * part of this screen rather than decoration: at a high tolerance an MEV bot can
 * move the price by nearly the whole allowance and keep the difference, and the
 * user has authorised exactly that. Nothing is silently clamped; they are simply
 * told before they commit.
 *
 * «پیش‌فرض» is a real, distinct choice — not zero. It means "use whatever this
 * coin's tolerance is", which is what most users should be on.
 */
export function TradeSettingsSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: (prefs: TradePreferences) => void;
}) {
  // `loaded` is part of the same state object so nothing has to be set
  // synchronously inside the effect (which would cascade renders); every write
  // below happens in an async callback.
  const [state, setState] = useState<{
    loaded: boolean;
    prefs: TradePreferences;
    error: string | null;
  }>({ loaded: false, prefs: DEFAULT_TRADE_PREFERENCES, error: null });
  const [saving, setSaving] = useState(false);

  const { prefs, error } = state;
  const loading = !state.loaded;
  const setPrefs = (next: TradePreferences): void =>
    setState((s) => ({ ...s, prefs: next }));

  // Re-read on every open so the sheet reflects what is actually STORED rather
  // than whatever it showed last time on this device. The previous values stay
  // visible while it loads, which reads better than a flash of skeleton.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/account/trade-preferences", {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("load failed");
        return (await res.json()) as { preferences: TradePreferences };
      })
      .then((body) => {
        if (!cancelled)
          setState({ loaded: true, prefs: body.preferences, error: null });
      })
      .catch(() => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loaded: true,
            error: "بارگذاری تنظیمات ناموفق بود.",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const risky =
    prefs.slippageBps !== null && prefs.slippageBps >= RISKY_SLIPPAGE_BPS;

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const res = await fetch("/api/account/trade-preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("save failed");
      // Adopt what the server STORED, not what we sent — these values change how
      // this user's orders execute.
      const body = (await res.json()) as { preferences: TradePreferences };
      setState({ loaded: true, prefs: body.preferences, error: null });
      onSaved?.(body.preferences);
      onClose();
    } catch {
      setState((s) => ({
        ...s,
        error: "ذخیره تنظیمات ناموفق بود. دوباره تلاش کنید.",
      }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="تنظیمات معامله">
      {loading ? (
        <p className="py-6 text-center text-[14px] text-muted">
          در حال بارگذاری…
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-ink">
                حداکثر لغزش قیمت
              </span>
              <span className="text-[13px] text-muted">
                {prefs.slippageBps === null
                  ? "پیش‌فرض هر رمزارز"
                  : formatSlippagePercent(prefs.slippageBps)}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {/* Default is a real choice, listed first: it means "use this
                  coin's own tolerance", which is where most users belong. */}
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, slippageBps: null })}
                className={cn(
                  "rounded-lg px-2 py-2 text-[12px] font-bold transition-colors",
                  prefs.slippageBps === null
                    ? "bg-brand text-white"
                    : "bg-surface text-muted hover:text-ink",
                )}
              >
                پیش‌فرض
              </button>
              {SLIPPAGE_PRESETS.map((bps) => (
                <button
                  key={bps}
                  type="button"
                  onClick={() => setPrefs({ ...prefs, slippageBps: bps })}
                  className={cn(
                    "rounded-lg px-2 py-2 text-[12px] font-bold transition-colors",
                    prefs.slippageBps === bps
                      ? "bg-brand text-white"
                      : "bg-surface text-muted hover:text-ink",
                  )}
                >
                  {formatSlippagePercent(bps)}
                </button>
              ))}
            </div>

            {risky ? (
              <p
                role="alert"
                className="text-[12px] font-bold leading-6 text-loss"
              >
                با این مقدار، ربات‌های بازار می‌توانند قیمت را تا نزدیک همین
                اندازه به ضرر شما جابه‌جا کنند و تفاوت را بردارند. این تنظیم
                محدود نمی‌شود — انتخاب با شماست.
              </p>
            ) : (
              <p className="text-[12px] leading-6 text-muted">
                سفارش شما بیش از این مقدار از قیمت لحظه‌ای فاصله نمی‌گیرد؛ در
                غیر این صورت انجام نمی‌شود.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-ink">
                مهلت تأیید سفارش
              </span>
              <span className="text-[13px] text-muted">
                {toPersianDigits(prefs.confirmSeconds)} ثانیه
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {CONFIRM_PRESETS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() =>
                    setPrefs({ ...prefs, confirmSeconds: seconds })
                  }
                  className={cn(
                    "rounded-lg px-2 py-2 text-[12px] font-bold transition-colors",
                    prefs.confirmSeconds === seconds
                      ? "bg-brand text-white"
                      : "bg-surface text-muted hover:text-ink",
                  )}
                >
                  {toPersianDigits(seconds)} ثانیه
                </button>
              ))}
            </div>
            <p className="text-[12px] leading-6 text-muted">
              پنجرهٔ تأیید سفارش تا این مدت باز می‌ماند. روی نحوهٔ انجام سفارش
              اثری ندارد.
            </p>
          </section>

          {error ? (
            <p role="alert" className="text-[13px] font-bold text-loss">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            size="xl"
            fullWidth
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "در حال ذخیره…" : "ذخیره"}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
