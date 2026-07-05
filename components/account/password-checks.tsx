"use client";

import { checkPassword } from "@/lib/core/domain/account/two-step-password";
import { CheckCircleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

const RULES: { key: keyof ReturnType<typeof checkPassword>; label: string }[] =
  [
    { key: "minLength", label: "حداقل ۸ کاراکتر" },
    { key: "upper", label: "حرف بزرگ انگلیسی (A-Z)" },
    { key: "lower", label: "حرف کوچک انگلیسی (a-z)" },
    { key: "digit", label: "عدد (0-9)" },
  ];

/** The four live password rules — words + icon, never color alone. */
export function PasswordChecks({ password }: { password: string }) {
  const checks = checkPassword(password);
  return (
    <ul className="flex flex-col gap-1.5" aria-label="شرایط رمز">
      {RULES.map((rule) => {
        const done = checks[rule.key];
        return (
          <li
            key={rule.key}
            className={cn(
              "flex items-center gap-2 text-[13px]",
              done ? "font-bold text-gain" : "text-muted",
            )}
          >
            <CheckCircleIcon
              size={16}
              className={done ? "text-gain" : "text-placeholder"}
            />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
