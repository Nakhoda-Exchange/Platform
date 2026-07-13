"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { CheckCircleIcon, ClockIcon, InfoIcon } from "@/components/ui/icons";

export type ToastVariant = "info" | "success" | "error" | "neutral";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms; 0 keeps it until dismissed. Default 4000. */
  duration?: number;
}

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  leaving: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
const EXIT_MS = 200;
const MAX_VISIBLE = 4;

/**
 * App-wide toast host. Provides `useToast()` and renders a fixed, RTL viewport
 * pinned under the top safe-area, capped to the platform's phone width. Toasts
 * auto-dismiss, stack newest-last, and honour `prefers-reduced-motion`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef(new Set<ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timeouts.current.delete(timer);
      fn();
    }, ms);
    timeouts.current.add(timer);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((list) =>
        list.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      );
      schedule(() => remove(id), EXIT_MS);
    },
    [remove, schedule],
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = ++nextId.current;
      const item: ToastItem = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? "info",
        leaving: false,
      };
      setToasts((list) => [...list, item].slice(-MAX_VISIBLE));

      const duration = options.duration ?? DEFAULT_DURATION;
      if (duration > 0) schedule(() => dismiss(id), duration);
      return id;
    },
    [dismiss, schedule],
  );

  useEffect(() => {
    const timers = timeouts.current;
    return () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/** Access the toast API. Must be called under a {@link ToastProvider}. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const VARIANT_ICON = {
  info: InfoIcon,
  success: CheckCircleIcon,
  error: InfoIcon,
  neutral: ClockIcon,
} as const;

const VARIANT_BADGE: Record<ToastVariant, string> = {
  info: "bg-brand-soft text-brand",
  success: "bg-gain-soft text-gain",
  error: "bg-loss-soft text-loss",
  neutral: "bg-surface text-muted",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto flex w-full max-w-[440px] flex-col gap-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
      {toasts.map((toast) => (
        <ToastRow key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const Glyph = VARIANT_ICON[toast.variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-paper p-3.5 shadow-lg shadow-black/5",
        "transition-all duration-200 ease-out motion-reduce:transition-none",
        shown && !toast.leaving
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 opacity-0",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          VARIANT_BADGE[toast.variant],
        )}
        aria-hidden
      >
        <Glyph size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-extrabold text-ink">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-[13px] leading-5 text-muted">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="بستن"
        className="-m-1 shrink-0 rounded-field p-1 text-muted transition-colors hover:text-ink"
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
