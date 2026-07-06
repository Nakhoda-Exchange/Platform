"use client";

import type { CurrencyUnits } from "@/lib/core/domain/config/currency-units";
import { setCurrencyUnits } from "@/lib/utils/money";

/**
 * Injects the server-provided currency unit labels into the client-side
 * formatter registry. Rendered FIRST in the root layout body, so the
 * registry is set (synchronously, during render) before any component
 * formats an amount. Idempotent.
 */
export function CurrencyUnitsHydrator({ units }: { units: CurrencyUnits }) {
  setCurrencyUnits(units);
  return null;
}
