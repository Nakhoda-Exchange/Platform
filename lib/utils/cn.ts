/**
 * Tiny classname joiner. Filters falsy values so components can compose
 * conditional classes without pulling in a dependency.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
