/**
 * Date helpers.
 *
 * Every timestamp is stored timezone-aware (UTC) and rendered in Kenya time
 * (`Africa/Nairobi`, UTC+3, no daylight saving). Formatting is centralised so a
 * decision reviewed at a printed time matches the audit trail.
 */

export const KENYA_TIME_ZONE = "Africa/Nairobi";

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: KENYA_TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeZone: KENYA_TIME_ZONE,
});

export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${dateTimeFormatter.format(date)} EAT`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

/**
 * Whole days from `now` until `deadline`, floored at zero so an overdue item
 * reads as "0 days" and is rendered with an overdue state rather than a
 * negative number.
 */
export function daysRemaining(
  deadline: Date | string,
  now: Date = new Date(),
): number {
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function isOverdue(
  deadline: Date | string,
  now: Date = new Date(),
): boolean {
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  return target.getTime() < now.getTime();
}

/** Adds whole days to a date, returning a new Date. */
export function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}
