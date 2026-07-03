import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

/** Wraps the authenticated app (market, wallet, account) in the platform shell. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
