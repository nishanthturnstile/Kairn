import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { domainAccount } from "../identity/schema.js";
import { digest, finite, positive } from "../schema/checks.js";
import { journey, journeysSchema, membership } from "./schema.js";

export const recipientGuard = journeysSchema
  .table(
    "recipient_guard",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      journeyId: uuid("journey_id")
        .notNull()
        .references(() => journey.id, { onDelete: "restrict" }),
      recipientKey: text("recipient_key").notNull(),
      recipientEmail: text("recipient_email"),
      boundAccountId: uuid("bound_account_id").references(() => domainAccount.id, {
        onDelete: "restrict",
      }),
      admissionEpoch: bigint("admission_epoch", { mode: "number" }).notNull().default(1),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      lastEndedAt: timestamp("last_ended_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      unique("guard_journey_recipient_unique").on(t.journeyId, t.recipientKey),
      unique("guard_id_journey_unique").on(t.id, t.journeyId),
      index("guard_bound_account_idx").on(t.boundAccountId, t.journeyId),
      digest("guard_recipient_key_check", t.recipientKey),
      positive("guard_revision_check", t.revision, t.admissionEpoch),
      check(
        "guard_email_check",
        sql`${t.recipientEmail} IS NULL OR char_length(${t.recipientEmail}) BETWEEN 3 AND 320`,
      ),
    ],
  )
  .enableRLS();

export const invitation = journeysSchema
  .table(
    "invitation",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      journeyId: uuid("journey_id").notNull(),
      guardId: uuid("guard_id").notNull(),
      admissionEpoch: bigint("admission_epoch", { mode: "number" }).notNull(),
      inviterMembershipId: uuid("inviter_membership_id").notNull(),
      inviterAccountId: uuid("inviter_account_id").notNull(),
      inviterMembershipEpoch: bigint("inviter_membership_epoch", { mode: "number" }).notNull(),
      secretHash: text("secret_hash").notNull().unique(),
      offeredCoauthor: boolean("offered_coauthor").notNull().default(false),
      offeredPublisher: boolean("offered_publisher").notNull().default(false),
      state: text("state").notNull().default("pending"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      closedAt: timestamp("closed_at", { withTimezone: true }),
      acceptedAccountId: uuid("accepted_account_id"),
      acceptedMembershipId: uuid("accepted_membership_id"),
      acceptedMembershipEpoch: bigint("accepted_membership_epoch", { mode: "number" }),
    },
    (t) => [
      foreignKey({
        name: "invitation_guard_journey_fk",
        columns: [t.guardId, t.journeyId],
        foreignColumns: [recipientGuard.id, recipientGuard.journeyId],
      }).onDelete("restrict"),
      foreignKey({
        name: "invitation_inviter_binding_fk",
        columns: [t.inviterMembershipId, t.journeyId, t.inviterAccountId],
        foreignColumns: [membership.id, membership.journeyId, membership.accountId],
      }).onDelete("restrict"),
      foreignKey({
        name: "invitation_acceptor_binding_fk",
        columns: [t.acceptedMembershipId, t.journeyId, t.acceptedAccountId],
        foreignColumns: [membership.id, membership.journeyId, membership.accountId],
      }).onDelete("restrict"),
      uniqueIndex("invitation_one_pending_guard")
        .on(t.guardId)
        .where(sql`${t.state} = 'pending'`),
      index("invitation_guard_history_idx").on(t.guardId, t.state, t.id),
      index("invitation_journey_state_idx").on(t.journeyId, t.state, t.createdAt, t.id),
      index("invitation_inviter_idx").on(t.inviterMembershipId),
      index("invitation_acceptor_idx").on(t.acceptedMembershipId),
      index("invitation_expiry_idx").on(t.state, t.expiresAt, t.id),
      digest("invitation_secret_hash_check", t.secretHash),
      positive("invitation_revision_check", t.revision, t.admissionEpoch, t.inviterMembershipEpoch),
      finite("invitation_state_check", t.state, [
        "pending",
        "accepted",
        "declined",
        "revoked",
        "expired",
        "superseded",
      ]),
      check(
        "invitation_expiry_check",
        sql`${t.expiresAt} > ${t.createdAt} AND ${t.expiresAt} <= ${t.createdAt} + interval '7 days'`,
      ),
      check(
        "invitation_close_check",
        sql`(${t.state} = 'pending' AND ${t.closedAt} IS NULL) OR (${t.state} <> 'pending' AND ${t.closedAt} IS NOT NULL AND ${t.closedAt} >= ${t.createdAt})`,
      ),
      check(
        "invitation_acceptance_check",
        sql`(${t.state} = 'accepted' AND ${t.acceptedAccountId} IS NOT NULL AND ${t.acceptedMembershipId} IS NOT NULL AND ${t.acceptedMembershipEpoch} IS NOT NULL AND ${t.acceptedMembershipEpoch} BETWEEN 1 AND 9007199254740991) OR (${t.state} <> 'accepted' AND ${t.acceptedAccountId} IS NULL AND ${t.acceptedMembershipId} IS NULL AND ${t.acceptedMembershipEpoch} IS NULL)`,
      ),
    ],
  )
  .enableRLS();

export const administrationTransfer = journeysSchema
  .table(
    "administration_transfer",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      journeyId: uuid("journey_id").notNull(),
      offeringMembershipId: uuid("offering_membership_id").notNull(),
      offeringAccountId: uuid("offering_account_id").notNull(),
      offeringEpoch: bigint("offering_epoch", { mode: "number" }).notNull(),
      targetMembershipId: uuid("target_membership_id").notNull(),
      targetAccountId: uuid("target_account_id").notNull(),
      targetEpoch: bigint("target_epoch", { mode: "number" }).notNull(),
      journeyPolicyGeneration: bigint("journey_policy_generation", { mode: "number" }).notNull(),
      state: text("state").notNull().default("offered"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      closedAt: timestamp("closed_at", { withTimezone: true }),
    },
    (t) => [
      foreignKey({
        name: "transfer_offering_binding_fk",
        columns: [t.offeringMembershipId, t.journeyId, t.offeringAccountId],
        foreignColumns: [membership.id, membership.journeyId, membership.accountId],
      }).onDelete("restrict"),
      foreignKey({
        name: "transfer_target_binding_fk",
        columns: [t.targetMembershipId, t.journeyId, t.targetAccountId],
        foreignColumns: [membership.id, membership.journeyId, membership.accountId],
      }).onDelete("restrict"),
      uniqueIndex("transfer_one_offered_journey")
        .on(t.journeyId)
        .where(sql`${t.state} = 'offered'`),
      index("transfer_offering_idx").on(t.offeringMembershipId),
      index("transfer_target_idx").on(t.targetMembershipId, t.state, t.id),
      index("transfer_expiry_idx").on(t.state, t.expiresAt, t.id),
      positive(
        "transfer_revision_check",
        t.revision,
        t.offeringEpoch,
        t.targetEpoch,
        t.journeyPolicyGeneration,
      ),
      finite("transfer_state_check", t.state, [
        "offered",
        "accepted",
        "declined",
        "cancelled",
        "expired",
        "invalidated",
      ]),
      check(
        "transfer_distinct_members_check",
        sql`${t.offeringMembershipId} <> ${t.targetMembershipId} AND ${t.offeringAccountId} <> ${t.targetAccountId}`,
      ),
      check(
        "transfer_expiry_check",
        sql`${t.expiresAt} > ${t.createdAt} AND ${t.expiresAt} <= ${t.createdAt} + interval '72 hours'`,
      ),
      check(
        "transfer_close_check",
        sql`(${t.state} = 'offered' AND ${t.closedAt} IS NULL) OR (${t.state} <> 'offered' AND ${t.closedAt} IS NOT NULL AND ${t.closedAt} >= ${t.createdAt})`,
      ),
    ],
  )
  .enableRLS();
