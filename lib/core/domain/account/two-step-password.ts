/**
 * Two-step password rules. The four checks are shown live as a checklist in
 * the set/reset forms; the same rules gate server-side in the use case.
 */
export interface PasswordChecks {
  minLength: boolean; // ≥ 8 characters
  upper: boolean; // at least one A-Z
  lower: boolean; // at least one a-z
  digit: boolean; // at least one 0-9
}

export const MIN_PASSWORD_LENGTH = 8;

export function checkPassword(password: string): PasswordChecks {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
  };
}

/** True when every checklist rule passes. */
export function isStrongPassword(password: string): boolean {
  return Object.values(checkPassword(password)).every(Boolean);
}
