import type { ReactNode } from "react";

/** Full-screen centered wrapper holding the 420px auth card column. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-5 py-10">
      <div className="flex w-full max-w-[420px] flex-col items-stretch gap-10">
        {children}
      </div>
    </main>
  );
}
