/** Two-step form state ("use server" files may only export async functions). */
export type TwoStepFormState =
  | { status: "idle" | "success" }
  | { status: "error"; message: string; code?: string };
