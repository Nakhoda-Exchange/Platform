"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Copies `value` to the clipboard with a brief «کپی شد» confirmation. */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      fullWidth
      className="bg-surface"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard can be unavailable (http, permissions) — leave the
          // address selectable as the fallback.
        }
      }}
    >
      {copied ? "کپی شد ✓" : "کپی آدرس"}
    </Button>
  );
}
