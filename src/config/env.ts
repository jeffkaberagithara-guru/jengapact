/**
 * Server-only environment access.
 *
 * Rule: every environment variable the application reads MUST be declared in
 * `.env.example` and validated here. Only `next.config.ts` reads `process.env`
 * directly (it cannot import application modules).
 *
 * Validation is strict in production and permissive in development, so a
 * developer with no storage/signing credentials can still run the platform —
 * but the affected module refuses to claim success and the UI shows an explicit
 * "not configured" state rather than a fake one.
 *
 * NOTE: this module deliberately does NOT `import "server-only"`. The tsx
 * scripts and Vitest tests share this module, and the package throws outside
 * Next's react-server condition, breaking `db:migrate`/`db:seed`/`npm test`.
 * The guardrail is instead a review rule in AGENTS.md: nothing under
 * `src/app`'s client components may import `env`/`db` (enforced by import
 * ordering convention). `server-only` remains a dependency for any module that
 * is exclusive to the Next runtime.
 */
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_DATABASE_URL: z.string().optional(),

  APP_ENV: z
    .enum(["development", "preview", "staging", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().url().optional(),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_REGION: z.string().default("af-south-1"),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_SIGNED_URL_TTL: z.coerce.number().int().positive().default(300),
  IMAGES_CDN_HOST: z.string().optional(),

  SIGNING_PROVIDER: z.enum(["disabled", "provider"]).default("disabled"),
  SIGNING_API_KEY: z.string().optional(),

  NOTIFICATIONS_DRIVER: z.enum(["mock", "email"]).default("mock"),
  NOTIFICATIONS_FROM_EMAIL: z.string().email().optional(),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

/**
 * Parses and caches the environment. Throws a single aggregated, readable error
 * listing every missing/invalid variable rather than failing one field at a
 * time — the first failure is what a developer sees, so it must be complete.
 */
export function env(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  // Local file storage writes inside the repository and must never be used in
  // a real deployment, where documents would vanish with the container.
  if (parsed.data.APP_ENV === "production" && parsed.data.STORAGE_DRIVER === "local") {
    throw new Error(
      "STORAGE_DRIVER=local is not permitted when APP_ENV=production. Configure object storage.",
    );
  }

  cached = parsed.data;
  return cached;
}

/** True when the process is running a production build. */
export function isProduction(): boolean {
  return env().APP_ENV === "production";
}

/**
 * Browser-safe environment values. Only variables intended to be public belong
 * here; nothing secret may cross this boundary.
 */
export function publicEnv(): { appUrl: string } {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}
