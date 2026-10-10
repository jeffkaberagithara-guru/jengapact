import { sql } from "drizzle-orm";
import { boolean, index, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { appSchema } from "./pg-schema";

/**
 * better-auth tables.
 *
 * These are the credential store. The domain profile (`users` in `schema.ts`)
 * is a separate table with the same UUID primary key. Keeping them apart means
 * better-auth physically cannot write the domain `users.role` — a role can never
 * be set from a client payload or an auth callback.
 *
 * `authUsers.id` and `users.id` are THE SAME UUID for the same person. This is
 * only safe because better-auth is configured with
 * `advanced.database.generateId: "uuid"` (see `modules/auth/auth.ts`); its
 * default is a 32-character string that would fail to insert into a `uuid`
 * column at runtime.
 *
 * FIELD NAMES ARE FIXED BY BETTER-AUTH, not by house style. Renaming a
 * TypeScript key here breaks authentication with no compile-time error, so
 * `auth-schema.test.ts` pins the key set.
 *
 * Tables are namespaced `auth_*` in SQL but registered under better-auth's model
 * names (`user`, `session`, `account`, `verification`) in `authSchema` below.
 */

const authTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const authUsers = appSchema.table(
  "auth_users",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    ...authTimestamps,
  },
  (t) => [uniqueIndex("auth_users_email_uniq").on(sql`lower(${t.email})`)],
);

export const authSessions = appSchema.table(
  "auth_sessions",
  {
    id: uuid("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    ...authTimestamps,
  },
  (t) => [
    uniqueIndex("auth_sessions_token_uniq").on(t.token),
    index("auth_sessions_user_idx").on(t.userId),
    index("auth_sessions_expires_idx").on(t.expiresAt),
  ],
);

export const authAccounts = appSchema.table(
  "auth_accounts",
  {
    id: uuid("id").primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    /** Password hash. Never returned by any read path. */
    password: text("password"),
    ...authTimestamps,
  },
  (t) => [
    uniqueIndex("auth_accounts_provider_account_uniq").on(t.providerId, t.accountId),
    index("auth_accounts_user_idx").on(t.userId),
  ],
);

export const authVerifications = appSchema.table(
  "auth_verifications",
  {
    id: uuid("id").primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...authTimestamps,
  },
  (t) => [
    index("auth_verifications_identifier_idx").on(t.identifier),
    index("auth_verifications_expires_idx").on(t.expiresAt),
  ],
);

/** Table map handed to better-auth's Drizzle adapter (keyed by model name). */
export const authSchema = {
  user: authUsers,
  session: authSessions,
  account: authAccounts,
  verification: authVerifications,
};
