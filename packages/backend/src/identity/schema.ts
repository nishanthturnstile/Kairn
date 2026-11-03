import { sql } from "drizzle-orm";
import { bigint, check, index, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

export const identitySchema = pgSchema("identity");
export const domainAccount = identitySchema
  .table(
    "account",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      authSubjectId: text("auth_subject_id")
        .unique()
        .references(() => user.id, { onDelete: "restrict" }),
      state: text("state").notNull().default("active"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
      check("account_state_check", sql`${table.state} IN ('active', 'deleting', 'deleted')`),
      check(
        "active_account_auth_mapping",
        sql`${table.state} <> 'active' OR ${table.authSubjectId} IS NOT NULL`,
      ),
      check(
        "account_revision_check",
        sql`${table.revision} BETWEEN 1 AND 9007199254740991 AND ${table.policyGeneration} BETWEEN 1 AND 9007199254740991`,
      ),
      check(
        "account_deletion_time_check",
        sql`(${table.state} = 'active' AND ${table.deletedAt} IS NULL) OR (${table.state} <> 'active' AND ${table.deletedAt} IS NOT NULL)`,
      ),
    ],
  )
  .enableRLS();
export const privateProfile = identitySchema
  .table(
    "profile",
    {
      accountId: uuid("account_id")
        .primaryKey()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      displayName: text("display_name").notNull(),
      bio: text("bio"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
    },
    (table) => [
      check(
        "profile_display_name_bounds",
        sql`char_length(${table.displayName}) BETWEEN 1 AND 80 AND ${table.displayName} = btrim(${table.displayName})`,
      ),
      check("profile_bio_bounds", sql`${table.bio} IS NULL OR char_length(${table.bio}) <= 500`),
      check("profile_revision_check", sql`${table.revision} BETWEEN 1 AND 9007199254740991`),
    ],
  )
  .enableRLS();
export const retiredAuthSubject = identitySchema
  .table(
    "retired_auth_subject",
    {
      // Deliberately no FK to a live auth user: failed purge or backup replay cannot erase the deny.
      authSubjectId: text("auth_subject_id").primaryKey(),
      accountId: uuid("account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      denyGeneration: bigint("deny_generation", { mode: "number" }).notNull(),
      retiredAt: timestamp("retired_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
      index("retired_subject_account_idx").on(table.accountId),
      check(
        "retired_subject_generation_check",
        sql`${table.denyGeneration} BETWEEN 1 AND 9007199254740991`,
      ),
    ],
  )
  .enableRLS();
