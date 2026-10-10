/**
 * Class-name joiner used by every component. Deliberately tiny: no dependency
 * on `clsx`/`tailwind-merge` behaviour beyond what is needed, and a stable
 * import path for tests.
 */
export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
      continue;
    }

    classes.push(String(input));
  }

  return classes.join(" ");
}
