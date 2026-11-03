import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  integer,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
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
export const profileAvatar = identitySchema
  .table(
    "profile_avatar",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      ownerAccountId: uuid("owner_account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      state: text("state").notNull().default("pending"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      quarantineBucket: text("quarantine_bucket").notNull(),
      quarantineKey: text("quarantine_key").notNull(),
      inputContentType: text("input_content_type").notNull(),
      inputBytes: integer("input_bytes").notNull(),
      inputSha256: text("input_sha256").notNull(),
      verifiedInputWidth: integer("verified_input_width"),
      verifiedInputHeight: integer("verified_input_height"),
      failureCode: text("failure_code"),
      representationBucket: text("representation_bucket"),
      representationKey: text("representation_key"),
      representationContentType: text("representation_content_type"),
      representationBytes: integer("representation_bytes"),
      representationSha256: text("representation_sha256"),
      width: integer("width"),
      height: integer("height"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      uploadExpiresAt: timestamp("upload_expires_at", { withTimezone: true }).notNull(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      check(
        "avatar_input_pixels_check",
        sql`(${t.verifiedInputWidth} IS NULL AND ${t.verifiedInputHeight} IS NULL AND ${t.state} NOT IN ('processing', 'available')) OR (${t.verifiedInputWidth} IS NOT NULL AND ${t.verifiedInputHeight} IS NOT NULL AND ${t.verifiedInputWidth} BETWEEN 1 AND 12000000 AND ${t.verifiedInputHeight} BETWEEN 1 AND 12000000 AND ${t.verifiedInputWidth}::bigint * ${t.verifiedInputHeight}::bigint <= 12000000 AND (${t.width} IS NULL OR (greatest(${t.width}, ${t.height}) <= greatest(${t.verifiedInputWidth}, ${t.verifiedInputHeight}) AND least(${t.width}, ${t.height}) <= least(${t.verifiedInputWidth}, ${t.verifiedInputHeight}))))`,
      ),
      check(
        "avatar_failure_check",
        sql`(${t.failureCode} IS NULL OR ${t.failureCode} IN ('unsupported_type', 'too_large', 'invalid_image', 'processing_unavailable')) AND (${t.state} <> 'failed' OR ${t.failureCode} IS NOT NULL)`,
      ),
      index("avatar_owner_state_idx").on(t.ownerAccountId, t.state, t.id),
      unique("avatar_id_owner_unique").on(t.id, t.ownerAccountId),
      unique("avatar_quarantine_location_unique").on(t.quarantineBucket, t.quarantineKey),
      unique("avatar_representation_location_unique").on(
        t.representationBucket,
        t.representationKey,
      ),
      uniqueIndex("avatar_one_available_owner")
        .on(t.ownerAccountId)
        .where(sql`${t.state} = 'available'`),
      uniqueIndex("avatar_one_pending_owner")
        .on(t.ownerAccountId)
        .where(sql`${t.state} IN ('pending', 'quarantined', 'processing')`),
      index("avatar_expiry_idx").on(t.state, t.uploadExpiresAt, t.id),
      check(
        "avatar_state_check",
        sql`${t.state} IN ('pending', 'quarantined', 'processing', 'available', 'failed', 'superseded', 'deleting', 'deleted')`,
      ),
      check("avatar_revision_check", sql`${t.revision} BETWEEN 1 AND 9007199254740991`),
      check(
        "avatar_input_check",
        sql`${t.inputContentType} IN ('image/jpeg', 'image/png') AND ${t.inputBytes} BETWEEN 1 AND 5242880 AND ${t.inputSha256} ~ '^[0-9a-f]{64}$'`,
      ),
      check(
        "avatar_location_check",
        sql`char_length(${t.quarantineBucket}) BETWEEN 1 AND 128 AND char_length(${t.quarantineKey}) BETWEEN 1 AND 512 AND (${t.representationBucket} IS NULL OR char_length(${t.representationBucket}) BETWEEN 1 AND 128) AND (${t.representationKey} IS NULL OR char_length(${t.representationKey}) BETWEEN 1 AND 512)`,
      ),
      check(
        "avatar_expiry_check",
        sql`${t.uploadExpiresAt} > ${t.createdAt} AND ${t.uploadExpiresAt} <= ${t.createdAt} + interval '24 hours'`,
      ),
      check(
        "avatar_representation_check",
        sql`(${t.representationBucket} IS NULL AND ${t.representationKey} IS NULL AND ${t.representationContentType} IS NULL AND ${t.representationBytes} IS NULL AND ${t.representationSha256} IS NULL AND ${t.width} IS NULL AND ${t.height} IS NULL AND ${t.state} <> 'available') OR (${t.representationBucket} IS NOT NULL AND ${t.representationKey} IS NOT NULL AND ${t.representationContentType} IS NOT NULL AND ${t.representationContentType} IN ('image/jpeg', 'image/png') AND ${t.representationBytes} IS NOT NULL AND ${t.representationBytes} BETWEEN 1 AND 5242880 AND ${t.representationSha256} IS NOT NULL AND ${t.representationSha256} ~ '^[0-9a-f]{64}$' AND ${t.width} IS NOT NULL AND ${t.height} IS NOT NULL AND ${t.width} BETWEEN 1 AND 512 AND ${t.height} BETWEEN 1 AND 512)`,
      ),
      check("avatar_deletion_check", sql`(${t.state} = 'deleted') = (${t.deletedAt} IS NOT NULL)`),
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
      avatarId: uuid("avatar_id"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
    },
    (table) => [
      foreignKey({
        name: "profile_avatar_owner_fk",
        columns: [table.avatarId, table.accountId],
        foreignColumns: [profileAvatar.id, profileAvatar.ownerAccountId],
      }).onDelete("restrict"),
      index("profile_avatar_idx").on(table.avatarId),
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
