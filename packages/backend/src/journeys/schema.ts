import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
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
import { domainAccount } from "../identity/schema.js";

export const journeysSchema = pgSchema("journeys");

export const journey = journeysSchema
  .table(
    "journey",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      creatorAccountId: uuid("creator_account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      title: text("title"),
      timeZone: text("time_zone"),
      startLocal: text("start_local"),
      startAt: timestamp("start_at", { withTimezone: true }),
      startOffsetMinutes: integer("start_offset_minutes"),
      endLocal: text("end_local"),
      endAt: timestamp("end_at", { withTimezone: true }),
      endOffsetMinutes: integer("end_offset_minutes"),
      category: text("category"),
      lifecycle: text("lifecycle").notNull().default("active"),
      administration: text("administration").notNull().default("assigned"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
      index("journey_creator_idx").on(table.creatorAccountId),
      check(
        "journey_lifecycle_check",
        sql`${table.lifecycle} IN ('active', 'archived', 'deleted')`,
      ),
      check("journey_administration_check", sql`${table.administration} IN ('assigned', 'frozen')`),
      check(
        "journey_revision_check",
        sql`${table.revision} BETWEEN 1 AND 9007199254740991 AND ${table.policyGeneration} BETWEEN 1 AND 9007199254740991`,
      ),
      check(
        "journey_title_check",
        sql`${table.title} IS NULL OR (char_length(${table.title}) BETWEEN 1 AND 160 AND ${table.title} = btrim(${table.title}))`,
      ),
      check(
        "journey_details_check",
        sql`${table.lifecycle} = 'deleted' OR (${table.title} IS NOT NULL AND ${table.timeZone} IS NOT NULL AND ${table.startLocal} IS NOT NULL AND ${table.startAt} IS NOT NULL AND ${table.startOffsetMinutes} IS NOT NULL)`,
      ),
      check(
        "journey_category_check",
        sql`${table.category} IS NULL OR ${table.category} IN ('hike_trek', 'cycling', 'road_journey', 'other')`,
      ),
      check(
        "journey_start_check",
        sql`(${table.startLocal} IS NULL AND ${table.startAt} IS NULL AND ${table.startOffsetMinutes} IS NULL) OR (${table.startLocal} IS NOT NULL AND ${table.startAt} IS NOT NULL AND ${table.startOffsetMinutes} IS NOT NULL AND ${table.startOffsetMinutes} BETWEEN -840 AND 840 AND ${table.startLocal} ~ '^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' AND ${table.startAt} >= timestamptz '0001-01-01 00:00:00+00' AND ${table.startAt} < timestamptz '10000-01-01 00:00:00+00' AND extract(second FROM ${table.startAt} AT TIME ZONE 'UTC') = 0)`,
      ),
      check(
        "journey_end_check",
        sql`(${table.endLocal} IS NULL AND ${table.endAt} IS NULL AND ${table.endOffsetMinutes} IS NULL) OR (${table.endLocal} IS NOT NULL AND ${table.endAt} IS NOT NULL AND ${table.endOffsetMinutes} IS NOT NULL AND ${table.startAt} IS NOT NULL AND ${table.endOffsetMinutes} BETWEEN -840 AND 840 AND ${table.endLocal} ~ '^(?!0000)[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' AND ${table.endAt} >= ${table.startAt} AND ${table.endAt} < timestamptz '10000-01-01 00:00:00+00' AND extract(second FROM ${table.endAt} AT TIME ZONE 'UTC') = 0)`,
      ),
      check(
        "journey_deletion_time_check",
        sql`(${table.lifecycle} = 'deleted') = (${table.deletedAt} IS NOT NULL)`,
      ),
    ],
  )
  .enableRLS();

export const membership = journeysSchema
  .table(
    "membership",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      journeyId: uuid("journey_id")
        .notNull()
        .references(() => journey.id, { onDelete: "restrict" }),
      accountId: uuid("account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      state: text("state").notNull().default("active"),
      epoch: bigint("epoch", { mode: "number" }).notNull().default(1),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
      endedAt: timestamp("ended_at", { withTimezone: true }),
      endReason: text("end_reason"),
      previousAdministrator: boolean("previous_administrator").notNull().default(false),
      previousCoauthor: boolean("previous_coauthor").notNull().default(false),
      previousPublisher: boolean("previous_publisher").notNull().default(false),
    },
    (table) => [
      unique("membership_journey_account_unique").on(table.journeyId, table.accountId),
      unique("membership_id_journey_unique").on(table.id, table.journeyId),
      unique("membership_id_journey_account_unique").on(table.id, table.journeyId, table.accountId),
      index("membership_account_history_idx").on(
        table.accountId,
        table.joinedAt.desc(),
        table.id.desc(),
      ),
      index("membership_journey_state_idx").on(table.journeyId, table.state, table.id),
      check("membership_state_check", sql`${table.state} IN ('active', 'left', 'removed')`),
      check(
        "membership_revision_check",
        sql`${table.revision} BETWEEN 1 AND 9007199254740991 AND ${table.epoch} BETWEEN 1 AND 9007199254740991`,
      ),
      check(
        "membership_end_check",
        sql`(${table.state} = 'active' AND ${table.endedAt} IS NULL AND ${table.endReason} IS NULL) OR (${table.endedAt} IS NOT NULL AND ${table.endReason} IS NOT NULL AND ${table.endedAt} >= ${table.joinedAt} AND ((${table.state} = 'left' AND ${table.endReason} = 'left') OR (${table.state} = 'removed' AND ${table.endReason} IN ('removed', 'journey_deleted'))))`,
      ),
    ],
  )
  .enableRLS();

export const memberCapability = journeysSchema
  .table(
    "member_capability",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      membershipId: uuid("membership_id").notNull(),
      journeyId: uuid("journey_id").notNull(),
      membershipEpoch: bigint("membership_epoch", { mode: "number" }).notNull(),
      capability: text("capability").notNull(),
      state: text("state").notNull().default("active"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      assignedBy: uuid("assigned_by")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
      revokedBy: uuid("revoked_by").references(() => domainAccount.id, { onDelete: "restrict" }),
      revokedAt: timestamp("revoked_at", { withTimezone: true }),
    },
    (table) => [
      foreignKey({
        name: "capability_membership_journey_fk",
        columns: [table.membershipId, table.journeyId],
        foreignColumns: [membership.id, membership.journeyId],
      }).onDelete("restrict"),
      unique("capability_membership_epoch_code_unique").on(
        table.membershipId,
        table.membershipEpoch,
        table.capability,
      ),
      uniqueIndex("journey_one_active_administrator")
        .on(table.journeyId)
        .where(sql`${table.capability} = 'administrator' AND ${table.state} = 'active'`),
      index("capability_journey_current_idx").on(table.journeyId, table.state, table.capability),
      index("capability_assigner_idx").on(table.assignedBy),
      index("capability_revoker_idx").on(table.revokedBy),
      check(
        "capability_code_check",
        sql`${table.capability} IN ('administrator', 'coauthor', 'publisher')`,
      ),
      check("capability_state_check", sql`${table.state} IN ('active', 'revoked')`),
      check(
        "capability_revision_check",
        sql`${table.revision} BETWEEN 1 AND 9007199254740991 AND ${table.membershipEpoch} BETWEEN 1 AND 9007199254740991`,
      ),
      check(
        "capability_revocation_check",
        sql`(${table.state} = 'active' AND ${table.revokedAt} IS NULL AND ${table.revokedBy} IS NULL) OR (${table.state} = 'revoked' AND ${table.revokedAt} IS NOT NULL AND ${table.revokedAt} >= ${table.assignedAt} AND ${table.revokedBy} IS NOT NULL)`,
      ),
    ],
  )
  .enableRLS();
