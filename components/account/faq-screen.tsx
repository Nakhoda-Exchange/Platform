"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { FAQ_SCOPES } from "./faq-data";
import { cn } from "@/lib/utils/cn";

/**
 * «سوالات متداول»: pick a scope (chips), then browse its questions. Each
 * question is a native <details> accordion — click to reveal the answer.
 * Native <details> keeps it keyboard- and screen-reader-accessible for free.
 */
export function FaqScreen() {
  const [scopeId, setScopeId] = useState(FAQ_SCOPES[0].id);
  const scope = FAQ_SCOPES.find((s) => s.id === scopeId) ?? FAQ_SCOPES[0];

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-8 pt-4">
      {/* Scopes — category filters */}
      <div aria-label="دسته‌بندی سوالات" className="flex flex-wrap gap-2">
        {FAQ_SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === scopeId}
            onClick={() => setScopeId(s.id)}
            className={cn(
              "rounded-full px-4 py-2 text-[13px] font-bold transition-colors",
              s.id === scopeId
                ? "bg-brand text-white"
                : "bg-surface text-muted hover:text-ink",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Questions in the selected scope */}
      <div className="flex flex-col gap-2">
        {scope.items.map((item) => (
          <details
            key={item.q}
            className="group overflow-hidden rounded-card border border-line bg-surface"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[15px] font-bold text-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDownIcon
                size={18}
                className="shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-4 text-[14px] leading-[2] text-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
