/**
 * Money.
 *
 * All monetary values are held as integer minor units (cents) to avoid
 * floating-point drift; `1_000_00` is KSh 1,000.00. The default and only
 * supported currency for the MVP is the Kenyan Shilling (KES), but the currency
 * code travels with every value so a second currency is a data change, not a
 * rewrite.
 *
 * Kenyan construction practice quotes whole shillings, so formatting prints the
 * minor units only when they are non-zero.
 */

export const DEFAULT_CURRENCY = "KES" as const;
export type CurrencyCode = typeof DEFAULT_CURRENCY;

export const MINOR_UNITS_PER_MAJOR = 100;

/** Integer minor units. Never a float. */
export type Minor = number;

export interface Money {
  minor: Minor;
  currency: CurrencyCode;
}

export function money(minor: Minor, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  if (!Number.isInteger(minor)) {
    throw new Error(`Money must be integer minor units, received ${minor}`);
  }
  return { minor, currency };
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.minor + b.minor, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.minor - b.minor, a.currency);
}

export function sum(values: readonly Money[]): Money {
  return values.reduce<Money>(
    (acc, value) => add(acc, value),
    money(0),
  );
}

/**
 * Multiplies integer minor units by a rational rate without leaving integer
 * space: `KSh 100 × 16%` → 1600 minor, computed in integer arithmetic with
 * round-half-up.
 */
export function multiplyByBasisPoints(a: Money, basisPoints: number): Money {
  if (!Number.isInteger(basisPoints)) {
    throw new Error("basisPoints must be an integer (16% is 1600 bps)");
  }
  const product = a.minor * basisPoints;
  // Round half away from zero, integer-only.
  const rounded = Math.sign(product) * Math.round(Math.abs(product) / 10_000);
  return money(rounded, a.currency);
}

/**
 * Parses user input into integer minor units. Accepts "1,234.50", "1234",
 * "KES 1 234" and rejects anything that is not a finite, non-negative amount
 * with at most two decimal places.
 *
 * Returns `null` rather than throwing so form validation can surface a field
 * error instead of a 500.
 */
export function parseAmountToMinor(input: string): Minor | null {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[\s,_]|KES/gi, "");
  if (cleaned === "" || !/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const negative = cleaned.startsWith("-");
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const paddedFraction = (fraction + "00").slice(0, 2);

  const major = Number(whole);
  const minorPart = Number(paddedFraction);
  if (!Number.isFinite(major)) return null;

  const minor = major * MINOR_UNITS_PER_MAJOR + minorPart;
  if (!Number.isSafeInteger(minor)) return null;

  return negative ? -minor : minor;
}

/** Formats integer minor units as a human-readable KES string. */
export function formatMoney(value: Money, options?: { withSymbol?: boolean }): string {
  const withSymbol = options?.withSymbol ?? true;
  const negative = value.minor < 0;
  const abs = Math.abs(value.minor);
  const major = Math.floor(abs / MINOR_UNITS_PER_MAJOR);
  const minorPart = abs % MINOR_UNITS_PER_MAJOR;

  const majorFormatted = major.toLocaleString("en-KE");
  const decimals =
    minorPart === 0 ? "" : `.${minorPart.toString().padStart(2, "0")}`;

  const symbol = withSymbol ? `${symbolFor(value.currency)} ` : "";
  return `${negative ? "-" : ""}${symbol}${majorFormatted}${decimals}`;
}

/** Compact display for dense tiles: KSh 148.25M, KSh 12.4K. */
export function formatMoneyCompact(value: Money): string {
  const negative = value.minor < 0;
  const major = Math.abs(value.minor) / MINOR_UNITS_PER_MAJOR;
  const sign = negative ? "-" : "";

  if (major >= 1_000_000_000) return `${sign}${symbolFor(value.currency)} ${(major / 1_000_000_000).toFixed(2)}B`;
  if (major >= 1_000_000) return `${sign}${symbolFor(value.currency)} ${(major / 1_000_000).toFixed(2)}M`;
  if (major >= 1_000) return `${sign}${symbolFor(value.currency)} ${(major / 1_000).toFixed(1)}K`;
  return formatMoney(value);
}

function symbolFor(currency: CurrencyCode): string {
  switch (currency) {
    case "KES":
      return "KSh";
  }
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}
