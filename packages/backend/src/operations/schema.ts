import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  foreignKey,
  index,
  integer,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { domainAccount } from "../identity/schema.js";
import { user } from "../identity/auth-schema.js";
import { journey, membership } from "../journeys/schema.js";
import { administrationTransfer, invitation } from "../journeys/admission-schema.js";
import { sourceIdentity, sourceGrant, exportGrant } from "../sources/schema.js";
import { digest, finite, positive } from "../schema/checks.js";

export const operationsSchema = pgSchema("operations");
const bytes = customType<{ data: Buffer }>({ dataType: () => "bytea" });
export const operationTypes = [
  "profile.update",
  "avatar.create",
  "avatar.replace",
  "avatar.delete",
  "account.delete",
  "journey.create",
  "journey.update",
  "journey.archive",
  "journey.delete",
  "membership.leave",
  "membership.remove",
  "capability.change",
  "invitation.create",
  "invitation.accept",
  "invitation.decline",
  "invitation.revoke",
  "invitation.resend",
  "invitation.reissue",
  "transfer.offer",
  "transfer.accept",
  "transfer.decline",
  "transfer.cancel",
  "source.register",
  "source_asset.register",
  "source_scope.change",
  "source_grant.withdraw",
  "export.request",
  "export.approve",
  "export.decline",
  "export.revoke",
  "notice.read",
] as const;
export const restrictionTypes = [
  "invitation.revoke",
  "invitation.supersede",
  "invitation.decline",
  "transfer.cancel",
  "transfer.decline",
  "transfer.invalidate",
  "transfer.accept",
  "journey.archive",
  "journey.freeze",
  "journey.delete",
  "membership.leave",
  "membership.remove",
  "capability.remove",
  "account.delete",
  "source.narrow",
  "source.withdraw",
  "source.delete",
  "export.revoke",
  "export.invalidate",
  "avatar.delete",
] as const;
export const lifecycleActions = [
  "leave",
  "remove_member",
  "archive",
  "delete_journey",
  "delete_account",
  "transfer_administration",
  "change_capabilities",
] as const;

export const commandReceipt = operationsSchema
  .table(
    "command_receipt",
    {
      actorAccountId: uuid("actor_account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      commandId: uuid("command_id").notNull(),
      operationType: text("operation_type").notNull(),
      payloadDigest: text("payload_digest").notNull(),
      resultState: text("result_state").notNull(),
      resourceKind: text("resource_kind"),
      resourceId: uuid("resource_id"),
      resourceRevision: bigint("resource_revision", { mode: "number" }),
      retentionState: text("retention_state").notNull().default("live"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.actorAccountId, t.commandId] }),
      index("command_expiry_idx").on(t.retentionState, t.expiresAt),
      finite("command_type_check", t.operationType, operationTypes),
      digest("command_payload_digest_check", t.payloadDigest),
      finite("command_result_state_check", t.resultState, [
        "accepted",
        "restriction_pending",
        "restriction_complete",
      ]),
      finite("command_retention_check", t.retentionState, ["live", "redacted"]),
      check(
        "command_resource_check",
        sql`(${t.resourceId} IS NULL AND ${t.resourceKind} IS NULL AND ${t.resourceRevision} IS NULL) OR (${t.resourceId} IS NOT NULL AND ${t.resourceKind} IS NOT NULL AND ${t.resourceKind} IN ('account', 'profile', 'avatar', 'journey', 'membership', 'invitation', 'transfer', 'source', 'source_grant', 'export_request', 'export_grant', 'lifecycle_operation') AND (${t.resourceRevision} IS NULL OR ${t.resourceRevision} BETWEEN 1 AND 9007199254740991))`,
      ),
      check(
        "command_expiry_check",
        sql`${t.expiresAt} > ${t.createdAt} AND ${t.expiresAt} <= ${t.createdAt} + interval '30 days'`,
      ),
      check(
        "command_redaction_check",
        sql`${t.retentionState} <> 'redacted' OR (${t.resourceId} IS NULL AND ${t.resourceKind} IS NULL AND ${t.resourceRevision} IS NULL)`,
      ),
    ],
  )
  .enableRLS();

export const impactPreview = operationsSchema
  .table(
    "impact_preview",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      actorAccountId: uuid("actor_account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      secretHash: text("secret_hash").notNull().unique(),
      action: text("action").notNull(),
      journeyId: uuid("journey_id").references(() => journey.id, { onDelete: "restrict" }),
      targetAccountId: uuid("target_account_id").references(() => domainAccount.id, {
        onDelete: "restrict",
      }),
      targetMembershipId: uuid("target_membership_id"),
      targetRevision: bigint("target_revision", { mode: "number" }).notNull(),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull(),
      impactDigest: text("impact_digest").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      consumedCommandId: uuid("consumed_command_id"),
      consumedAt: timestamp("consumed_at", { withTimezone: true }),
    },
    (t) => [
      foreignKey({
        name: "impact_member_journey_fk",
        columns: [t.targetMembershipId, t.journeyId],
        foreignColumns: [membership.id, membership.journeyId],
      }).onDelete("restrict"),
      foreignKey({
        name: "impact_command_fk",
        columns: [t.actorAccountId, t.consumedCommandId],
        foreignColumns: [commandReceipt.actorAccountId, commandReceipt.commandId],
      }).onDelete("restrict"),
      index("impact_actor_idx").on(t.actorAccountId, t.id),
      index("impact_expiry_idx").on(t.expiresAt),
      index("impact_journey_idx").on(t.journeyId),
      index("impact_account_idx").on(t.targetAccountId),
      index("impact_member_idx").on(t.targetMembershipId),
      digest("impact_secret_check", t.secretHash),
      digest("impact_digest_check", t.impactDigest),
      finite("impact_action_check", t.action, lifecycleActions),
      positive("impact_versions_check", t.targetRevision, t.policyGeneration),
      check(
        "impact_expiry_check",
        sql`${t.expiresAt} > ${t.createdAt} AND ${t.expiresAt} <= ${t.createdAt} + interval '5 minutes'`,
      ),
      check(
        "impact_target_check",
        sql`(${t.action} = 'delete_account' AND ${t.targetAccountId} IS NOT NULL AND ${t.targetAccountId} = ${t.actorAccountId} AND ${t.journeyId} IS NULL AND ${t.targetMembershipId} IS NULL) OR (${t.action} <> 'delete_account' AND ${t.journeyId} IS NOT NULL AND ${t.targetAccountId} IS NULL)`,
      ),
      check(
        "impact_consumption_check",
        sql`(${t.consumedCommandId} IS NULL AND ${t.consumedAt} IS NULL) OR (${t.consumedCommandId} IS NOT NULL AND ${t.consumedAt} IS NOT NULL AND ${t.consumedAt} >= ${t.createdAt} AND ${t.consumedAt} <= ${t.expiresAt})`,
      ),
    ],
  )
  .enableRLS();
export const lifecycleOperation = operationsSchema
  .table(
    "lifecycle_operation",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      actorAccountId: uuid("actor_account_id").notNull(),
      commandId: uuid("command_id").notNull(),
      action: text("action").notNull(),
      resourceKind: text("resource_kind").notNull(),
      resourceId: uuid("resource_id").notNull(),
      journeyId: uuid("journey_id").references(() => journey.id, { onDelete: "restrict" }),
      targetAccountId: uuid("target_account_id").references(() => domainAccount.id, {
        onDelete: "restrict",
      }),
      targetMembershipId: uuid("target_membership_id"),
      impactDigest: text("impact_digest").notNull(),
      targetRevision: bigint("target_revision", { mode: "number" }).notNull(),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull(),
      state: text("state").notNull().default("denied"),
      recoveryState: text("recovery_state").notNull().default("pending"),
      processedUnits: integer("processed_units").notNull().default(0),
      totalUnits: integer("total_units").notNull().default(0),
      nextUnitId: uuid("next_unit_id"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      errorCode: text("error_code"),
      statusReceiptHash: text("status_receipt_hash").unique(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
      receiptHardExpiresAt: timestamp("receipt_hard_expires_at", { withTimezone: true }),
      terminalAt: timestamp("terminal_at", { withTimezone: true }),
      terminalAvailableUntil: timestamp("terminal_available_until", { withTimezone: true }),
    },
    (t) => [
      foreignKey({
        name: "lifecycle_member_journey_fk",
        columns: [t.targetMembershipId, t.journeyId],
        foreignColumns: [membership.id, membership.journeyId],
      }).onDelete("restrict"),
      foreignKey({
        name: "lifecycle_command_fk",
        columns: [t.actorAccountId, t.commandId],
        foreignColumns: [commandReceipt.actorAccountId, commandReceipt.commandId],
      }).onDelete("restrict"),
      unique("lifecycle_command_unique").on(t.actorAccountId, t.commandId),
      index("lifecycle_pending_idx").on(t.state, t.updatedAt, t.id),
      index("lifecycle_journey_idx").on(t.journeyId),
      index("lifecycle_account_idx").on(t.targetAccountId),
      index("lifecycle_membership_idx").on(t.targetMembershipId),
      finite("lifecycle_action_check", t.action, [...lifecycleActions, ...restrictionTypes]),
      finite("lifecycle_state_check", t.state, ["denied", "processing", "complete", "failed"]),
      finite("lifecycle_recovery_check", t.recoveryState, ["pending", "confirmed"]),
      positive("lifecycle_version_check", t.revision, t.targetRevision, t.policyGeneration),
      digest("lifecycle_impact_check", t.impactDigest),
      check(
        "lifecycle_error_check",
        sql`${t.errorCode} IS NULL OR ${t.errorCode} IN ('retryable', 'integrity_failure', 'cleanup_failed')`,
      ),
      check(
        "lifecycle_progress_check",
        sql`${t.processedUnits} >= 0 AND ${t.totalUnits} >= ${t.processedUnits} AND (${t.state} <> 'complete' OR ${t.processedUnits} = ${t.totalUnits}) AND ${t.updatedAt} >= ${t.createdAt}`,
      ),
      check(
        "lifecycle_target_check",
        sql`CASE
 WHEN ${t.action} IN ('delete_account', 'account.delete') THEN ${t.resourceKind} = 'account' AND ${t.targetAccountId} IS NOT NULL AND ${t.targetAccountId} = ${t.actorAccountId} AND ${t.resourceId} = ${t.actorAccountId} AND ${t.journeyId} IS NULL AND ${t.targetMembershipId} IS NULL
 WHEN ${t.action} IN ('archive', 'delete_journey', 'journey.archive', 'journey.freeze', 'journey.delete') THEN ${t.resourceKind} = 'journey' AND ${t.journeyId} IS NOT NULL AND ${t.resourceId} = ${t.journeyId} AND ${t.targetAccountId} IS NULL AND ${t.targetMembershipId} IS NULL
 WHEN ${t.action} IN ('leave', 'remove_member', 'change_capabilities', 'membership.leave', 'membership.remove', 'capability.remove') THEN ${t.resourceKind} = 'membership' AND ${t.journeyId} IS NOT NULL AND ${t.targetMembershipId} IS NOT NULL AND ${t.resourceId} = ${t.targetMembershipId} AND ${t.targetAccountId} IS NULL
 WHEN ${t.action} IN ('transfer_administration', 'transfer.cancel', 'transfer.decline', 'transfer.invalidate', 'transfer.accept') THEN ${t.resourceKind} = 'transfer' AND ${t.journeyId} IS NOT NULL AND ${t.targetAccountId} IS NULL
 WHEN ${t.action} IN ('invitation.revoke', 'invitation.supersede', 'invitation.decline') THEN ${t.resourceKind} = 'invitation' AND ${t.journeyId} IS NOT NULL AND ${t.targetAccountId} IS NULL AND ${t.targetMembershipId} IS NULL
 WHEN ${t.action} IN ('source.narrow', 'source.withdraw') THEN ${t.resourceKind} = 'source_grant' AND ${t.journeyId} IS NOT NULL AND ${t.targetAccountId} IS NULL AND ${t.targetMembershipId} IS NULL
 WHEN ${t.action} IN ('export.revoke', 'export.invalidate') THEN ${t.resourceKind} = 'export_grant' AND ${t.journeyId} IS NOT NULL AND ${t.targetAccountId} IS NULL AND ${t.targetMembershipId} IS NULL
 WHEN ${t.action} = 'source.delete' THEN ${t.resourceKind} = 'source' AND ${t.targetAccountId} IS NULL AND ${t.targetMembershipId} IS NULL
 WHEN ${t.action} = 'avatar.delete' THEN ${t.resourceKind} = 'avatar' AND ${t.journeyId} IS NULL AND ${t.targetAccountId} IS NULL AND ${t.targetMembershipId} IS NULL ELSE false END`,
      ),
      check(
        "lifecycle_receipt_check",
        sql`(${t.statusReceiptHash} IS NULL AND ${t.receiptHardExpiresAt} IS NULL AND ${t.terminalAvailableUntil} IS NULL) OR (${t.action} IN ('delete_account', 'account.delete') AND ${t.statusReceiptHash} IS NOT NULL AND ${t.statusReceiptHash} ~ '^[0-9a-f]{64}$' AND ${t.receiptHardExpiresAt} IS NOT NULL AND ${t.receiptHardExpiresAt} > ${t.createdAt} AND ${t.receiptHardExpiresAt} <= ${t.createdAt} + interval '45 days' AND (${t.terminalAvailableUntil} IS NULL OR (${t.terminalAt} IS NOT NULL AND ${t.terminalAvailableUntil} > ${t.terminalAt} AND ${t.terminalAvailableUntil} <= ${t.terminalAt} + interval '7 days' AND ${t.terminalAvailableUntil} <= ${t.receiptHardExpiresAt})))`,
      ),
      check(
        "lifecycle_terminal_check",
        sql`(${t.state} = 'complete' AND ${t.terminalAt} IS NOT NULL AND ${t.terminalAt} >= ${t.createdAt}) OR (${t.state} <> 'complete' AND ${t.terminalAt} IS NULL AND ${t.terminalAvailableUntil} IS NULL)`,
      ),
    ],
  )
  .enableRLS();

export const auditEvent = operationsSchema
  .table(
    "audit_event",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      actorKind: text("actor_kind").notNull(),
      serviceName: text("service_name"),
      operatorId: uuid("operator_id"),
      inspectionPurpose: text("inspection_purpose"),
      caseId: uuid("case_id"),
      actorAccountId: uuid("actor_account_id").references(() => domainAccount.id, {
        onDelete: "restrict",
      }),
      commandId: uuid("command_id"),
      action: text("action").notNull(),
      journeyId: uuid("journey_id").references(() => journey.id, { onDelete: "restrict" }),
      sourceId: uuid("source_id").references(() => sourceIdentity.id, { onDelete: "restrict" }),
      subjectAccountId: uuid("subject_account_id").references(() => domainAccount.id, {
        onDelete: "restrict",
      }),
      targetId: uuid("target_id").notNull(),
      revision: bigint("revision", { mode: "number" }).notNull(),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull(),
      occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      foreignKey({
        name: "audit_command_fk",
        columns: [t.actorAccountId, t.commandId],
        foreignColumns: [commandReceipt.actorAccountId, commandReceipt.commandId],
      }).onDelete("restrict"),
      index("audit_actor_cursor_idx").on(t.actorAccountId, t.occurredAt, t.id),
      index("audit_command_idx").on(t.actorAccountId, t.commandId),
      index("audit_journey_cursor_idx").on(t.journeyId, t.occurredAt, t.id),
      index("audit_source_idx").on(t.sourceId),
      index("audit_subject_idx").on(t.subjectAccountId),
      finite("audit_actor_kind_check", t.actorKind, ["account", "service", "operator"]),
      finite("audit_action_check", t.action, [
        ...operationTypes,
        "restriction.confirm",
        "cleanup.complete",
        "operator.inspect",
      ]),
      positive("audit_version_check", t.revision, t.policyGeneration),
      check(
        "audit_actor_check",
        sql`(${t.actorKind} = 'account' AND ${t.actorAccountId} IS NOT NULL AND ${t.commandId} IS NOT NULL AND ${t.serviceName} IS NULL AND ${t.operatorId} IS NULL AND ${t.inspectionPurpose} IS NULL AND ${t.caseId} IS NULL) OR (${t.actorKind} = 'service' AND ${t.actorAccountId} IS NULL AND ${t.commandId} IS NULL AND ${t.serviceName} IS NOT NULL AND ${t.serviceName} IN ('lifecycle_worker', 'restriction_coordinator', 'identity_media_worker', 'email_worker') AND ${t.operatorId} IS NULL AND ${t.inspectionPurpose} IS NULL AND ${t.caseId} IS NULL) OR (${t.actorKind} = 'operator' AND ${t.actorAccountId} IS NULL AND ${t.commandId} IS NULL AND ${t.serviceName} IS NOT NULL AND ${t.serviceName} = 'operator_console' AND ${t.operatorId} IS NOT NULL AND ${t.inspectionPurpose} IS NOT NULL AND ${t.inspectionPurpose} IN ('support_case', 'incident_response', 'recovery', 'retention') AND ${t.caseId} IS NOT NULL)`,
      ),
    ],
  )
  .enableRLS();
export const accountNotice = operationsSchema
  .table(
    "account_notice",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      recipientAccountId: uuid("recipient_account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      eventId: uuid("event_id")
        .notNull()
        .references(() => auditEvent.id, { onDelete: "restrict" }),
      kind: text("kind").notNull(),
      journeyId: uuid("journey_id").references(() => journey.id, { onDelete: "restrict" }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      readAt: timestamp("read_at", { withTimezone: true }),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
    },
    (t) => [
      unique("notice_event_recipient_unique").on(t.eventId, t.recipientAccountId),
      index("notice_recipient_cursor_idx").on(
        t.recipientAccountId,
        t.createdAt.desc(),
        t.id.desc(),
      ),
      index("notice_journey_idx").on(t.journeyId),
      finite("notice_kind_check", t.kind, [
        "invitation",
        "capability_change",
        "transfer",
        "lifecycle",
      ]),
      positive("notice_revision_check", t.revision),
      check("notice_read_check", sql`${t.readAt} IS NULL OR ${t.readAt} >= ${t.createdAt}`),
    ],
  )
  .enableRLS();
export const domainChange = operationsSchema
  .table(
    "domain_change",
    {
      cursor: bigint("cursor", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
      scope: text("scope").notNull(),
      accountId: uuid("account_id").references(() => domainAccount.id, { onDelete: "restrict" }),
      journeyId: uuid("journey_id").references(() => journey.id, { onDelete: "restrict" }),
      actorAccountId: uuid("actor_account_id").notNull(),
      commandId: uuid("command_id").notNull(),
      targetKind: text("target_kind").notNull(),
      targetId: uuid("target_id").notNull(),
      revision: bigint("revision", { mode: "number" }).notNull(),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull(),
      tombstone: boolean("tombstone").notNull().default(false),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      foreignKey({
        name: "change_command_fk",
        columns: [t.actorAccountId, t.commandId],
        foreignColumns: [commandReceipt.actorAccountId, commandReceipt.commandId],
      }).onDelete("restrict"),
      index("change_account_cursor_idx").on(t.accountId, t.cursor),
      index("change_journey_cursor_idx").on(t.journeyId, t.cursor),
      index("change_command_idx").on(t.actorAccountId, t.commandId),
      positive("change_versions_check", t.cursor, t.revision, t.policyGeneration),
      finite("change_target_check", t.targetKind, [
        "account",
        "profile",
        "journey",
        "membership",
        "capability",
        "invitation",
        "transfer",
        "source_grant",
        "export_grant",
      ]),
      check(
        "change_scope_check",
        sql`(${t.scope} = 'account' AND ${t.accountId} IS NOT NULL AND ${t.journeyId} IS NULL) OR (${t.scope} = 'journey' AND ${t.journeyId} IS NOT NULL AND ${t.accountId} IS NULL AND ${t.targetKind} = 'journey' AND ${t.targetId} = ${t.journeyId})`,
      ),
    ],
  )
  .enableRLS();
export const restrictionEvent = operationsSchema
  .table(
    "restriction_event",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      operationId: uuid("operation_id")
        .notNull()
        .references(() => lifecycleOperation.id, { onDelete: "restrict" }),
      kind: text("kind").notNull(),
      accountId: uuid("account_id").references(() => domainAccount.id, { onDelete: "restrict" }),
      journeyId: uuid("journey_id").references(() => journey.id, { onDelete: "restrict" }),
      membershipId: uuid("membership_id").references(() => membership.id, { onDelete: "restrict" }),
      sourceId: uuid("source_id").references(() => sourceIdentity.id, { onDelete: "restrict" }),
      sourceGrantId: uuid("source_grant_id").references(() => sourceGrant.id, {
        onDelete: "restrict",
      }),
      exportGrantId: uuid("export_grant_id").references(() => exportGrant.id, {
        onDelete: "restrict",
      }),
      invitationId: uuid("invitation_id").references(() => invitation.id, { onDelete: "restrict" }),
      transferId: uuid("transfer_id").references(() => administrationTransfer.id, {
        onDelete: "restrict",
      }),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull(),
      integritySha256: text("integrity_sha256").notNull(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      index("restriction_operation_idx").on(t.operationId, t.id),
      index("restriction_account_idx").on(t.accountId),
      index("restriction_journey_idx").on(t.journeyId),
      index("restriction_membership_idx").on(t.membershipId),
      index("restriction_source_idx").on(t.sourceId),
      index("restriction_source_grant_idx").on(t.sourceGrantId),
      index("restriction_export_grant_idx").on(t.exportGrantId),
      index("restriction_invitation_idx").on(t.invitationId),
      index("restriction_transfer_idx").on(t.transferId),
      finite("restriction_kind_check", t.kind, restrictionTypes),
      positive("restriction_generation_check", t.policyGeneration),
      digest("restriction_integrity_check", t.integritySha256),
      check(
        "restriction_target_check",
        sql`num_nonnulls(${t.accountId}, ${t.journeyId}, ${t.membershipId}, ${t.sourceId}, ${t.sourceGrantId}, ${t.exportGrantId}, ${t.invitationId}, ${t.transferId}) > 0`,
      ),
    ],
  )
  .enableRLS();
export const restrictionReceipt = operationsSchema
  .table(
    "restriction_receipt",
    {
      eventId: uuid("event_id")
        .primaryKey()
        .references(() => restrictionEvent.id, { onDelete: "restrict" }),
      externalReceipt: text("external_receipt").notNull().unique(),
      sequence: bigint("sequence", { mode: "number" }).notNull().unique(),
      checkpointSha256: text("checkpoint_sha256").notNull(),
      eventSha256: text("event_sha256").notNull(),
      keyId: text("key_id").notNull(),
      confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      positive("receipt_sequence_check", t.sequence),
      digest("receipt_checkpoint_check", t.checkpointSha256),
      digest("receipt_event_check", t.eventSha256),
      check(
        "receipt_external_check",
        sql`char_length(${t.externalReceipt}) BETWEEN 1 AND 256 AND ${t.externalReceipt} ~ '^[A-Za-z0-9._:-]+$' AND char_length(${t.keyId}) BETWEEN 1 AND 64 AND ${t.keyId} ~ '^[A-Za-z0-9._:-]+$'`,
      ),
    ],
  )
  .enableRLS();
export const restrictionDelivery = operationsSchema
  .table(
    "restriction_delivery",
    {
      eventId: uuid("event_id")
        .primaryKey()
        .references(() => restrictionEvent.id, { onDelete: "restrict" }),
      state: text("state").notNull().default("pending"),
      attempts: integer("attempts").notNull().default(0),
      nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
      lastErrorCode: text("last_error_code"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
    },
    (t) => [
      index("restriction_pending_idx").on(t.state, t.nextAttemptAt, t.eventId),
      positive("restriction_delivery_revision_check", t.revision),
      finite("restriction_delivery_state_check", t.state, ["pending", "confirmed"]),
      check(
        "restriction_attempt_check",
        sql`${t.attempts} >= 0 AND (${t.lastErrorCode} IS NULL OR ${t.lastErrorCode} IN ('unavailable', 'unknown_outcome', 'integrity_failure'))`,
      ),
    ],
  )
  .enableRLS();
export const emailDelivery = operationsSchema
  .table(
    "email_delivery",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      purpose: text("purpose").notNull(),
      recipientKey: text("recipient_key").notNull(),
      authSubjectId: text("auth_subject_id").references(() => user.id, { onDelete: "restrict" }),
      recipientAccountId: uuid("recipient_account_id").references(() => domainAccount.id, {
        onDelete: "restrict",
      }),
      invitationId: uuid("invitation_id").references(() => invitation.id, { onDelete: "restrict" }),
      transferId: uuid("transfer_id").references(() => administrationTransfer.id, {
        onDelete: "restrict",
      }),
      actorAccountId: uuid("actor_account_id"),
      commandId: uuid("command_id"),
      policyGeneration: bigint("policy_generation", { mode: "number" }).notNull(),
      state: text("state").notNull().default("queued"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      attempts: integer("attempts").notNull().default(0),
      keyId: text("key_id"),
      ciphertext: bytes("ciphertext"),
      nonce: bytes("nonce"),
      authenticationTag: bytes("authentication_tag"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      payloadPurgeAfter: timestamp("payload_purge_after", { withTimezone: true }).notNull(),
      nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
      smtpAcceptedAt: timestamp("smtp_accepted_at", { withTimezone: true }),
      lastErrorCode: text("last_error_code"),
    },
    (t) => [
      foreignKey({
        name: "email_command_fk",
        columns: [t.actorAccountId, t.commandId],
        foreignColumns: [commandReceipt.actorAccountId, commandReceipt.commandId],
      }).onDelete("restrict"),
      index("email_pending_idx").on(t.state, t.nextAttemptAt, t.id),
      index("email_payload_expiry_idx").on(t.payloadPurgeAfter),
      index("email_auth_idx").on(t.authSubjectId),
      index("email_recipient_idx").on(t.recipientAccountId),
      index("email_invitation_idx").on(t.invitationId),
      index("email_transfer_idx").on(t.transferId),
      index("email_command_idx").on(t.actorAccountId, t.commandId),
      finite("email_purpose_check", t.purpose, [
        "verification",
        "password_reset",
        "invitation",
        "transfer",
        "security",
      ]),
      digest("email_recipient_key_check", t.recipientKey),
      finite("email_state_check", t.state, [
        "queued",
        "sending",
        "smtp_accepted",
        "failed",
        "expired",
        "cancelled",
      ]),
      positive("email_versions_check", t.revision, t.policyGeneration),
      check(
        "email_attempt_check",
        sql`${t.attempts} >= 0 AND (${t.lastErrorCode} IS NULL OR ${t.lastErrorCode} IN ('smtp_unavailable', 'expired', 'invalidated', 'payload_unavailable'))`,
      ),
      check(
        "email_lifetime_check",
        sql`${t.expiresAt} <= ${t.createdAt} + CASE ${t.purpose} WHEN 'password_reset' THEN interval '30 minutes' WHEN 'invitation' THEN interval '7 days' WHEN 'transfer' THEN interval '72 hours' ELSE interval '24 hours' END`,
      ),
      check(
        "email_time_check",
        sql`${t.expiresAt} > ${t.createdAt} AND ${t.payloadPurgeAfter} >= ${t.expiresAt} AND ${t.payloadPurgeAfter} <= ${t.expiresAt} + interval '1 hour'`,
      ),
      check(
        "email_command_pair_check",
        sql`(${t.actorAccountId} IS NULL) = (${t.commandId} IS NULL)`,
      ),
      check(
        "email_binding_check",
        sql`(${t.purpose} IN ('verification', 'password_reset') AND ${t.authSubjectId} IS NOT NULL AND ${t.invitationId} IS NULL AND ${t.transferId} IS NULL) OR (${t.purpose} = 'invitation' AND ${t.invitationId} IS NOT NULL AND ${t.authSubjectId} IS NULL AND ${t.transferId} IS NULL) OR (${t.purpose} = 'transfer' AND ${t.transferId} IS NOT NULL AND ${t.authSubjectId} IS NULL AND ${t.invitationId} IS NULL) OR (${t.purpose} = 'security' AND ${t.recipientAccountId} IS NOT NULL)`,
      ),
      check(
        "email_sealed_payload_check",
        sql`(${t.keyId} IS NULL AND ${t.ciphertext} IS NULL AND ${t.nonce} IS NULL AND ${t.authenticationTag} IS NULL AND ${t.state} IN ('smtp_accepted', 'expired', 'cancelled', 'failed')) OR (${t.keyId} IS NOT NULL AND char_length(${t.keyId}) BETWEEN 1 AND 64 AND ${t.ciphertext} IS NOT NULL AND octet_length(${t.ciphertext}) BETWEEN 16 AND 65536 AND ${t.nonce} IS NOT NULL AND octet_length(${t.nonce}) = 12 AND ${t.authenticationTag} IS NOT NULL AND octet_length(${t.authenticationTag}) = 16)`,
      ),
      check(
        "email_acceptance_check",
        sql`(${t.state} = 'smtp_accepted') = (${t.smtpAcceptedAt} IS NOT NULL)`,
      ),
    ],
  )
  .enableRLS();
export const abuseCounter = operationsSchema
  .table(
    "abuse_counter",
    {
      operation: text("operation").notNull(),
      keyHash: text("key_hash").notNull(),
      windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
      windowSeconds: integer("window_seconds").notNull(),
      count: integer("count").notNull(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.operation, t.keyHash, t.windowStartedAt] }),
      index("abuse_expiry_idx").on(t.expiresAt),
      digest("abuse_key_check", t.keyHash),
      finite("abuse_operation_check", t.operation, [
        "sign_in",
        "register",
        "auth_mail",
        "invite_create",
        "invite_resolve",
        "policy_mutation",
        "export",
        "status_poll",
      ]),
      check(
        "abuse_window_check",
        sql`${t.windowSeconds} BETWEEN 1 AND 86400 AND ${t.count} >= 0 AND ${t.expiresAt} >= ${t.windowStartedAt} + ${t.windowSeconds} * interval '1 second' AND ${t.expiresAt} <= ${t.windowStartedAt} + ${t.windowSeconds} * interval '1 second' + interval '48 hours'`,
      ),
    ],
  )
  .enableRLS();

// Recovery barriers survive replay even when the restored checkpoint predates a resource.
// These are operator-owned opaque deny records, never a source of application authority.
export const recoveryBarrier = operationsSchema
  .table(
    "recovery_barrier",
    {
      resourceKind: text("resource_kind").notNull(),
      resourceId: uuid("resource_id").notNull(),
      generation: bigint("generation", { mode: "number" }).notNull(),
      sequence: bigint("sequence", { mode: "number" }).notNull(),
      checkpointSha256: text("checkpoint_sha256").notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.resourceKind, t.resourceId] }),
      finite("recovery_barrier_kind", t.resourceKind, [
        "account",
        "journey",
        "membership",
        "invitation",
        "transfer",
        "source",
        "source_grant",
        "export_grant",
        "avatar",
      ]),
      positive("recovery_barrier_versions", t.generation, t.sequence),
      digest("recovery_barrier_hash", t.checkpointSha256),
    ],
  )
  .enableRLS();
export const recoveryCheckpoint = operationsSchema
  .table(
    "recovery_checkpoint",
    {
      id: integer("id").primaryKey(),
      sequence: bigint("sequence", { mode: "number" }).notNull(),
      checkpointSha256: text("checkpoint_sha256").notNull(),
    },
    (t) => [
      check("recovery_checkpoint_singleton", sql`${t.id}=1 AND ${t.sequence}>=0`),
      digest("recovery_checkpoint_hash", t.checkpointSha256),
    ],
  )
  .enableRLS();
