import { createHash, randomUUID } from "node:crypto";

/**
 * Deterministic hashing and identifiers.
 *
 * SHA-256 fingerprints are used to detect whether a stored document or an
 * executed agreement version has changed. A matching hash proves the bytes are
 * intact — nothing more. It does NOT prove authorship, truth, or legal
 * validity, and the UI must never imply that it does.
 */

/** Lowercase hex SHA-256 of a string. */
export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Stable JSON serialisation: object keys are sorted so that two equivalent
 * objects produce the same hash regardless of key insertion order.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);

  return `{${entries.join(",")}}`;
}

/** Fingerprint for structured data (agreement clause snapshots, payloads). */
export function contentHash(value: unknown): string {
  return sha256Hex(stableStringify(value));
}

/** Short, human-scannable prefix of a hash, e.g. "8f42e9c1a3bd". */
export function shortHash(hash: string, length = 12): string {
  return hash.slice(0, length);
}

/** A new UUID v4 for primary keys. */
export function newId(): string {
  return randomUUID();
}

/**
 * A short, uppercase, project-scoped reference such as `VAR-005`.
 * Uniqueness is enforced by the database via a unique constraint on
 * (project_id, reference); this only produces the candidate.
 */
export function formatReference(prefix: string, sequence: number): string {
  return `${prefix.toUpperCase()}-${sequence.toString().padStart(3, "0")}`;
}
