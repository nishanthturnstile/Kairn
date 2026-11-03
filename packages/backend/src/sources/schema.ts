import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { domainAccount } from "../identity/schema.js";
import { journey, membership } from "../journeys/schema.js";
import { finite, positive } from "../schema/checks.js";

export const sourcesSchema = pgSchema("sources");
export const sourceIdentity = sourcesSchema
  .table(
    "source",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      ownerAccountId: uuid("owner_account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      kind: text("kind").notNull(),
      provenance: text("provenance").notNull(),
      state: text("state").notNull().default("active"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      unique("source_id_owner_unique").on(t.id, t.ownerAccountId),
      index("source_owner_idx").on(t.ownerAccountId, t.state, t.id),
      finite("source_kind_check", t.kind, ["photo", "audio", "video", "note", "location", "track"]),
      finite("source_provenance_check", t.provenance, ["native_capture", "selected_import"]),
      finite("source_state_check", t.state, ["active", "deleting", "deleted"]),
      positive("source_revision_check", t.revision),
      check(
        "source_deletion_check",
        sql`(${t.state} = 'active' AND ${t.deletedAt} IS NULL) OR (${t.state} <> 'active' AND ${t.deletedAt} IS NOT NULL)`,
      ),
    ],
  )
  .enableRLS();
export const sourceAsset = sourcesSchema
  .table(
    "source_asset",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      sourceId: uuid("source_id").notNull(),
      ownerAccountId: uuid("owner_account_id").notNull(),
      purpose: text("purpose").notNull().default("original"),
      kind: text("kind").notNull(),
      state: text("state").notNull().default("registered"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      contentType: text("content_type"),
      verifiedBytes: bigint("verified_bytes", { mode: "number" }),
      verifiedSha256: text("verified_sha256"),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (t) => [
      foreignKey({
        name: "asset_source_owner_fk",
        columns: [t.sourceId, t.ownerAccountId],
        foreignColumns: [sourceIdentity.id, sourceIdentity.ownerAccountId],
      }).onDelete("restrict"),
      unique("asset_id_source_owner_unique").on(t.id, t.sourceId, t.ownerAccountId),
      index("asset_source_idx").on(t.sourceId, t.id),
      index("asset_owner_idx").on(t.ownerAccountId, t.state, t.id),
      check("asset_purpose_check", sql`${t.purpose} = 'original'`),
      finite("asset_kind_check", t.kind, ["image", "audio", "video", "text", "track"]),
      finite("asset_state_check", t.state, ["registered", "verified", "deleting", "deleted"]),
      positive("asset_revision_check", t.revision),
      check(
        "asset_verification_check",
        sql`(${t.verifiedBytes} IS NULL AND ${t.verifiedSha256} IS NULL AND ${t.contentType} IS NULL AND ${t.state} <> 'verified') OR (${t.verifiedBytes} IS NOT NULL AND ${t.verifiedBytes} BETWEEN 1 AND 9007199254740991 AND ${t.verifiedSha256} IS NOT NULL AND ${t.verifiedSha256} ~ '^[0-9a-f]{64}$' AND ${t.contentType} IS NOT NULL AND char_length(${t.contentType}) BETWEEN 1 AND 128)`,
      ),
      check(
        "asset_deletion_check",
        sql`(${t.state} IN ('registered', 'verified') AND ${t.deletedAt} IS NULL) OR (${t.state} IN ('deleting', 'deleted') AND ${t.deletedAt} IS NOT NULL)`,
      ),
    ],
  )
  .enableRLS();
export const sourceGrant = sourcesSchema
  .table(
    "source_grant",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      sourceId: uuid("source_id").notNull(),
      ownerAccountId: uuid("owner_account_id").notNull(),
      journeyId: uuid("journey_id")
        .notNull()
        .references(() => journey.id, { onDelete: "restrict" }),
      scope: text("scope").notNull(),
      state: text("state").notNull(),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      changedBy: uuid("changed_by").references(() => domainAccount.id, { onDelete: "restrict" }),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      foreignKey({
        name: "source_grant_owner_fk",
        columns: [t.sourceId, t.ownerAccountId],
        foreignColumns: [sourceIdentity.id, sourceIdentity.ownerAccountId],
      }).onDelete("restrict"),
      unique("source_grant_source_journey_unique").on(t.sourceId, t.journeyId),
      unique("source_grant_binding_unique").on(t.id, t.sourceId, t.journeyId, t.ownerAccountId),
      index("source_grant_journey_idx").on(t.journeyId, t.state, t.sourceId),
      index("source_grant_owner_idx").on(t.ownerAccountId, t.id),
      index("source_grant_actor_idx").on(t.changedBy),
      finite("source_grant_scope_check", t.scope, [
        "only_me",
        "journey_review",
        "publication_reuse",
      ]),
      finite("source_grant_state_check", t.state, ["active", "withdrawn"]),
      positive("source_grant_revision_check", t.revision),
      check(
        "source_grant_scope_state_check",
        sql`(${t.state} = 'withdrawn') = (${t.scope} = 'only_me')`,
      ),
      check(
        "source_grant_actor_check",
        sql`${t.changedBy} IS NULL OR ${t.changedBy} = ${t.ownerAccountId}`,
      ),
      check("source_grant_time_check", sql`${t.changedAt} >= ${t.createdAt}`),
    ],
  )
  .enableRLS();
export const exportRequest = sourcesSchema
  .table(
    "export_request",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      ownerAccountId: uuid("owner_account_id")
        .notNull()
        .references(() => domainAccount.id, { onDelete: "restrict" }),
      journeyId: uuid("journey_id").notNull(),
      requesterAccountId: uuid("requester_account_id").notNull(),
      requesterMembershipId: uuid("requester_membership_id").notNull(),
      requesterEpoch: bigint("requester_epoch", { mode: "number" }).notNull(),
      state: text("state").notNull().default("requested"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      closedAt: timestamp("closed_at", { withTimezone: true }),
    },
    (t) => [
      foreignKey({
        name: "export_request_membership_fk",
        columns: [t.requesterMembershipId, t.journeyId, t.requesterAccountId],
        foreignColumns: [membership.id, membership.journeyId, membership.accountId],
      }).onDelete("restrict"),
      unique("export_request_owner_journey_unique").on(t.id, t.ownerAccountId, t.journeyId),
      unique("export_request_recipient_binding_unique").on(
        t.id,
        t.ownerAccountId,
        t.journeyId,
        t.requesterAccountId,
        t.requesterMembershipId,
        t.requesterEpoch,
      ),
      index("export_request_owner_idx").on(t.ownerAccountId, t.state, t.createdAt, t.id),
      index("export_request_recipient_idx").on(t.requesterAccountId, t.state, t.createdAt, t.id),
      index("export_request_membership_idx").on(t.requesterMembershipId),
      index("export_request_journey_idx").on(t.journeyId),
      index("export_request_expiry_idx").on(t.state, t.expiresAt, t.id),
      positive("export_request_revision_check", t.revision, t.requesterEpoch),
      finite("export_request_state_check", t.state, [
        "requested",
        "approved",
        "declined",
        "expired",
        "invalidated",
      ]),
      check("export_request_expiry_check", sql`${t.expiresAt} > ${t.createdAt}`),
      check(
        "export_request_close_check",
        sql`(${t.state} = 'requested' AND ${t.closedAt} IS NULL) OR (${t.state} <> 'requested' AND ${t.closedAt} IS NOT NULL AND ${t.closedAt} >= ${t.createdAt})`,
      ),
    ],
  )
  .enableRLS();
export const exportRequestAsset = sourcesSchema
  .table(
    "export_request_asset",
    {
      requestId: uuid("request_id").notNull(),
      assetId: uuid("asset_id").notNull(),
      sourceId: uuid("source_id").notNull(),
      ownerAccountId: uuid("owner_account_id").notNull(),
      journeyId: uuid("journey_id").notNull(),
      sourceGrantId: uuid("source_grant_id").notNull(),
      assetRevision: bigint("asset_revision", { mode: "number" }).notNull(),
      sourceGrantRevision: bigint("source_grant_revision", { mode: "number" }).notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.requestId, t.assetId] }),
      foreignKey({
        name: "request_asset_request_binding_fk",
        columns: [t.requestId, t.ownerAccountId, t.journeyId],
        foreignColumns: [exportRequest.id, exportRequest.ownerAccountId, exportRequest.journeyId],
      }).onDelete("restrict"),
      foreignKey({
        name: "request_asset_identity_fk",
        columns: [t.assetId, t.sourceId, t.ownerAccountId],
        foreignColumns: [sourceAsset.id, sourceAsset.sourceId, sourceAsset.ownerAccountId],
      }).onDelete("restrict"),
      foreignKey({
        name: "request_asset_source_grant_fk",
        columns: [t.sourceGrantId, t.sourceId, t.journeyId, t.ownerAccountId],
        foreignColumns: [
          sourceGrant.id,
          sourceGrant.sourceId,
          sourceGrant.journeyId,
          sourceGrant.ownerAccountId,
        ],
      }).onDelete("restrict"),
      unique("request_asset_issued_binding_unique").on(
        t.requestId,
        t.assetId,
        t.sourceId,
        t.ownerAccountId,
        t.journeyId,
        t.sourceGrantId,
        t.assetRevision,
        t.sourceGrantRevision,
      ),
      index("request_asset_asset_idx").on(t.assetId),
      index("request_asset_grant_idx").on(t.sourceGrantId),
      positive("request_asset_revision_check", t.assetRevision, t.sourceGrantRevision),
    ],
  )
  .enableRLS();
export const exportGrant = sourcesSchema
  .table(
    "export_grant",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      requestId: uuid("request_id").notNull().unique(),
      ownerAccountId: uuid("owner_account_id").notNull(),
      journeyId: uuid("journey_id").notNull(),
      recipientAccountId: uuid("recipient_account_id").notNull(),
      recipientMembershipId: uuid("recipient_membership_id").notNull(),
      recipientEpoch: bigint("recipient_epoch", { mode: "number" }).notNull(),
      state: text("state").notNull().default("active"),
      revision: bigint("revision", { mode: "number" }).notNull().default(1),
      issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      closedAt: timestamp("closed_at", { withTimezone: true }),
    },
    (t) => [
      foreignKey({
        name: "export_grant_request_recipient_fk",
        columns: [
          t.requestId,
          t.ownerAccountId,
          t.journeyId,
          t.recipientAccountId,
          t.recipientMembershipId,
          t.recipientEpoch,
        ],
        foreignColumns: [
          exportRequest.id,
          exportRequest.ownerAccountId,
          exportRequest.journeyId,
          exportRequest.requesterAccountId,
          exportRequest.requesterMembershipId,
          exportRequest.requesterEpoch,
        ],
      }).onDelete("restrict"),
      unique("export_grant_request_binding_unique").on(
        t.id,
        t.requestId,
        t.ownerAccountId,
        t.journeyId,
      ),
      index("export_grant_recipient_idx").on(t.recipientAccountId, t.state, t.expiresAt, t.id),
      index("export_grant_owner_idx").on(t.ownerAccountId, t.state, t.id),
      index("export_grant_membership_idx").on(t.recipientMembershipId),
      index("export_grant_journey_idx").on(t.journeyId),
      positive("export_grant_revision_check", t.revision, t.recipientEpoch),
      finite("export_grant_state_check", t.state, ["active", "revoked", "expired", "invalidated"]),
      check(
        "export_grant_expiry_check",
        sql`${t.expiresAt} > ${t.issuedAt} AND ${t.expiresAt} <= ${t.issuedAt} + interval '7 days'`,
      ),
      check(
        "export_grant_close_check",
        sql`(${t.state} = 'active' AND ${t.closedAt} IS NULL) OR (${t.state} <> 'active' AND ${t.closedAt} IS NOT NULL AND ${t.closedAt} >= ${t.issuedAt})`,
      ),
    ],
  )
  .enableRLS();
export const exportGrantAsset = sourcesSchema
  .table(
    "export_grant_asset",
    {
      grantId: uuid("grant_id").notNull(),
      requestId: uuid("request_id").notNull(),
      assetId: uuid("asset_id").notNull(),
      sourceId: uuid("source_id").notNull(),
      ownerAccountId: uuid("owner_account_id").notNull(),
      journeyId: uuid("journey_id").notNull(),
      sourceGrantId: uuid("source_grant_id").notNull(),
      assetRevision: bigint("asset_revision", { mode: "number" }).notNull(),
      sourceGrantRevision: bigint("source_grant_revision", { mode: "number" }).notNull(),
    },
    (t) => [
      primaryKey({ columns: [t.grantId, t.assetId] }),
      foreignKey({
        name: "grant_asset_export_binding_fk",
        columns: [t.grantId, t.requestId, t.ownerAccountId, t.journeyId],
        foreignColumns: [
          exportGrant.id,
          exportGrant.requestId,
          exportGrant.ownerAccountId,
          exportGrant.journeyId,
        ],
      }).onDelete("restrict"),
      // Snapshot FKs terminate at immutable requested bindings, never at a mutable current revision.
      foreignKey({
        name: "grant_asset_exact_requested_binding_fk",
        columns: [
          t.requestId,
          t.assetId,
          t.sourceId,
          t.ownerAccountId,
          t.journeyId,
          t.sourceGrantId,
          t.assetRevision,
          t.sourceGrantRevision,
        ],
        foreignColumns: [
          exportRequestAsset.requestId,
          exportRequestAsset.assetId,
          exportRequestAsset.sourceId,
          exportRequestAsset.ownerAccountId,
          exportRequestAsset.journeyId,
          exportRequestAsset.sourceGrantId,
          exportRequestAsset.assetRevision,
          exportRequestAsset.sourceGrantRevision,
        ],
      }).onDelete("restrict"),
      index("grant_asset_requested_idx").on(t.requestId, t.assetId),
      index("grant_asset_asset_idx").on(t.assetId),
      index("grant_asset_source_grant_idx").on(t.sourceGrantId),
      positive("grant_asset_revision_check", t.assetRevision, t.sourceGrantRevision),
    ],
  )
  .enableRLS();
