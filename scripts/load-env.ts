/**
 * Environment loading for the standalone `scripts/` entrypoints.
 *
 * `npm run db:migrate` / `db:seed` run under `tsx`, which does not load
 * `.env.local` the way `next dev` does. `process.loadEnvFile` is available on
 * the Node floor this project declares (>=22.22), so there is no dependency to
 * add. Environment variables already set win: a CI job that injects
 * `DATABASE_URL` directly must not have it silently overridden by a local file.
 *
 * Order-sensitive: this MUST be the first import of any entrypoint that
 * transitively touches `src/config/env`.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

for (const file of [".env.local", ".env"]) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue;
  process.loadEnvFile(path);
}
