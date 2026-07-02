// Plain module (no "use server") — a server-action file may only export async
// functions, so the shared state types and initial values live here.

export interface AuthFormState {
  error: string | null;
}

export const initialAuthFormState: AuthFormState = { error: null };
