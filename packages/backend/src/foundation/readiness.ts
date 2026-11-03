import type { PoolClient } from "pg";

// Expected column ACLs are explicit. Schema changes do not silently expose a new
// secret column through a blanket read grant on a previously private record.
const restrictedReads = {
  profile_avatar: [
    "id",
    "owner_account_id",
    "failure_code",
    "state",
    "revision",
    "representation_content_type",
    "representation_bytes",
    "representation_sha256",
    "width",
    "height",
    "created_at",
    "upload_expires_at",
    "deleted_at",
  ],
  recipient_guard: [
    "id",
    "journey_id",
    "bound_account_id",
    "admission_epoch",
    "revision",
    "last_ended_at",
    "created_at",
  ],
  invitation: [
    "id",
    "journey_id",
    "guard_id",
    "admission_epoch",
    "inviter_membership_id",
    "inviter_account_id",
    "inviter_membership_epoch",
    "offered_coauthor",
    "offered_publisher",
    "state",
    "revision",
    "created_at",
    "expires_at",
    "closed_at",
    "accepted_account_id",
    "accepted_membership_id",
    "accepted_membership_epoch",
  ],
  impact_preview: [
    "id",
    "actor_account_id",
    "action",
    "journey_id",
    "target_account_id",
    "target_membership_id",
    "target_revision",
    "policy_generation",
    "impact_digest",
    "created_at",
    "expires_at",
    "consumed_command_id",
    "consumed_at",
  ],
  lifecycle_operation: [
    "id",
    "actor_account_id",
    "command_id",
    "action",
    "resource_kind",
    "resource_id",
    "journey_id",
    "target_account_id",
    "target_membership_id",
    "impact_digest",
    "target_revision",
    "policy_generation",
    "state",
    "recovery_state",
    "processed_units",
    "total_units",
    "next_unit_id",
    "revision",
    "error_code",
    "created_at",
    "updated_at",
    "receipt_hard_expires_at",
    "terminal_at",
    "terminal_available_until",
  ],
  account_notice: ["id", "recipient_account_id", "created_at", "read_at", "revision"],
  restriction_receipt: [
    "event_id",
    "sequence",
    "checkpoint_sha256",
    "event_sha256",
    "confirmed_at",
  ],
};
const objects = [
  { schema: "identity", table: "profile_avatar", columns: restrictedReads.profile_avatar },
  { schema: "journeys", table: "recipient_guard", columns: restrictedReads.recipient_guard },
  { schema: "journeys", table: "invitation", columns: restrictedReads.invitation },
  { schema: "journeys", table: "administration_transfer", columns: null },
  ...[
    "source",
    "source_asset",
    "source_grant",
    "export_request",
    "export_request_asset",
    "export_grant",
    "export_grant_asset",
  ].map((table) => ({ schema: "sources", table, columns: null })),
  ...[
    "command_receipt",
    "audit_event",
    "domain_change",
    "restriction_event",
    "restriction_delivery",
  ].map((table) => ({ schema: "operations", table, columns: null })),
  { schema: "operations", table: "impact_preview", columns: restrictedReads.impact_preview },
  {
    schema: "operations",
    table: "lifecycle_operation",
    columns: restrictedReads.lifecycle_operation,
  },
  { schema: "operations", table: "account_notice", columns: restrictedReads.account_notice },
  {
    schema: "operations",
    table: "restriction_receipt",
    columns: restrictedReads.restriction_receipt,
  },
  { schema: "operations", table: "email_delivery", columns: [] },
  { schema: "operations", table: "abuse_counter", columns: [] },
];
const helperColumns = [
  { schema: "identity", table: "account", columns: ["id", "state"] },
  { schema: "journeys", table: "journey", columns: ["id", "lifecycle", "administration"] },
  {
    schema: "journeys",
    table: "membership",
    columns: ["id", "journey_id", "account_id", "epoch", "state"],
  },
  {
    schema: "journeys",
    table: "member_capability",
    columns: ["id", "membership_id", "journey_id", "membership_epoch", "capability", "state"],
  },
  {
    schema: "journeys",
    table: "recipient_guard",
    columns: ["id", "journey_id", "bound_account_id"],
  },
  { schema: "journeys", table: "invitation", columns: ["id", "journey_id", "guard_id"] },
  {
    schema: "journeys",
    table: "administration_transfer",
    columns: ["id", "journey_id", "target_membership_id", "target_account_id", "target_epoch"],
  },
  { schema: "sources", table: "source", columns: ["id", "owner_account_id", "state"] },
  {
    schema: "sources",
    table: "source_asset",
    columns: ["id", "source_id", "owner_account_id", "purpose", "state", "revision"],
  },
  {
    schema: "sources",
    table: "source_grant",
    columns: ["id", "source_id", "owner_account_id", "journey_id", "scope", "state", "revision"],
  },
  {
    schema: "sources",
    table: "export_request",
    columns: [
      "id",
      "owner_account_id",
      "journey_id",
      "requester_account_id",
      "requester_membership_id",
      "requester_epoch",
    ],
  },
  {
    schema: "sources",
    table: "export_grant",
    columns: [
      "id",
      "owner_account_id",
      "journey_id",
      "recipient_account_id",
      "recipient_membership_id",
      "recipient_epoch",
      "state",
      "expires_at",
    ],
  },
  {
    schema: "sources",
    table: "export_grant_asset",
    columns: [
      "grant_id",
      "asset_id",
      "source_id",
      "source_grant_id",
      "owner_account_id",
      "journey_id",
      "asset_revision",
      "source_grant_revision",
    ],
  },
];
const guards = [
  "operation_target",
  "avatar_verified_input",
  "operation_confirmation",
  "receipt_operation_confirmation",
  "avatar_transition",
  "profile_avatar_selection",
  "avatar_selection",
  "guard_transition",
  "guard_invalidation",
  "invitation_transition",
  "membership_admission_end",
  "administrator_offer_end",
  "journey_offer_end",
  "transfer_transition",
  "transfer_acceptance",
  "source_identity_transition",
  "asset_identity_transition",
  "source_grant_transition",
  "source_grant_insert",
  "request_asset_transition",
  "export_request_transition",
  "export_grant_transition",
  "issued_asset_transition",
  "request_exact_assets",
  "request_asset_count",
  "grant_exact_assets",
  "grant_asset_count",
  "command_transition",
  "audit_immutable",
  "change_immutable",
  "restriction_immutable",
  "receipt_immutable",
  "impact_transition",
  "lifecycle_transition",
  "notice_transition",
  "email_transition",
  "restriction_delivery_transition",
  "receipt_integrity",
  "delivery_receipt_integrity",
];
export async function assertFoundationStructure(client: PoolClient) {
  const result = await client.query(
    `WITH expected AS (
    SELECT * FROM pg_catalog.jsonb_to_recordset($1::jsonb) AS e(schema text, "table" text, columns text[])
  ), objects AS (
    SELECT e.*, c.oid, c.relrowsecurity, c.relforcerowsecurity, c.relowner FROM expected AS e
    LEFT JOIN pg_catalog.pg_namespace AS n ON n.nspname = e.schema
    LEFT JOIN pg_catalog.pg_class AS c ON c.relnamespace = n.oid AND c.relname = e."table" AND c.relkind = 'r'
  ), helpers AS (
    SELECT * FROM pg_catalog.jsonb_to_recordset($2::jsonb) AS e(schema text, "table" text, columns text[])
  ), attributes AS (
    SELECT c.oid, n.nspname, c.relname, a.attname FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_attribute AS a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname IN ('authn', 'identity', 'journeys', 'sources', 'operations') AND c.relkind IN ('r', 'p')
  ) SELECT
    (SELECT bool_and(oid IS NOT NULL AND relrowsecurity AND relforcerowsecurity AND pg_catalog.pg_get_userbyid(relowner) = 'kairn_migrator') FROM objects)
    AND EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kairn_access_policy' AND NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication)
    AND NOT EXISTS (SELECT FROM pg_catalog.pg_roles AS r WHERE r.rolname IN ('kairn_auth', 'kairn_server', 'kairn_worker')
      AND (pg_catalog.pg_has_role(r.oid, 'kairn_access_policy', 'SET') OR pg_catalog.pg_has_role(r.oid, 'kairn_access_policy', 'USAGE')))
    AND NOT EXISTS (SELECT FROM pg_catalog.pg_namespace AS n CROSS JOIN pg_catalog.pg_roles AS r
      WHERE n.nspname IN ('identity', 'journeys', 'sources', 'operations') AND r.rolname IN ('kairn_auth', 'kairn_server', 'kairn_worker', 'kairn_access_policy')
      AND (pg_catalog.has_schema_privilege(r.oid, n.oid, 'CREATE') OR (n.nspname IN ('sources', 'operations') AND r.rolname IN ('kairn_auth', 'kairn_worker') AND pg_catalog.has_schema_privilege(r.oid, n.oid, 'USAGE'))))
    AND NOT EXISTS (SELECT FROM objects AS o JOIN pg_catalog.pg_attribute AS a ON a.attrelid = o.oid AND a.attnum > 0 AND NOT a.attisdropped
      WHERE pg_catalog.has_column_privilege('kairn_server', o.oid, a.attname, 'SELECT') IS DISTINCT FROM (o.columns IS NULL OR a.attname = ANY(o.columns))
        OR pg_catalog.has_column_privilege('kairn_server', o.oid, a.attname, 'INSERT') IS DISTINCT FROM (o.schema = 'operations' AND o."table" IN ('audit_event', 'domain_change', 'restriction_event'))
        OR pg_catalog.has_column_privilege('kairn_server', o.oid, a.attname, 'UPDATE,REFERENCES'))
    AND NOT EXISTS (SELECT FROM objects AS o WHERE pg_catalog.has_table_privilege('kairn_server', o.oid, 'DELETE,TRUNCATE,TRIGGER'))
    AND NOT EXISTS (SELECT FROM objects AS o CROSS JOIN pg_catalog.pg_roles AS r WHERE r.rolname IN ('kairn_auth', 'kairn_worker')
      AND (pg_catalog.has_any_column_privilege(r.oid, o.oid, 'SELECT,INSERT,UPDATE,REFERENCES') OR pg_catalog.has_table_privilege(r.oid, o.oid, 'DELETE,TRUNCATE,TRIGGER')))
    AND NOT EXISTS (SELECT FROM attributes AS a LEFT JOIN helpers AS h ON h.schema = a.nspname AND h."table" = a.relname
      WHERE pg_catalog.has_column_privilege('kairn_access_policy', a.oid, a.attname, 'SELECT') IS DISTINCT FROM coalesce(a.attname = ANY(h.columns), false)
        OR pg_catalog.has_column_privilege('kairn_access_policy', a.oid, a.attname, 'INSERT,UPDATE,REFERENCES')
        OR pg_catalog.has_table_privilege('kairn_access_policy', a.oid, 'DELETE,TRUNCATE,TRIGGER'))
    AND (SELECT count(*) = 10 AND bool_and(p.prosecdef AND pg_catalog.pg_get_userbyid(p.proowner) = 'kairn_access_policy'
      AND p.proconfig @> ARRAY['search_path=""', 'row_security=on'] AND pg_catalog.has_function_privilege('kairn_server', p.oid, 'EXECUTE')
      AND NOT pg_catalog.has_function_privilege('kairn_auth', p.oid, 'EXECUTE') AND NOT pg_catalog.has_function_privilege('kairn_worker', p.oid, 'EXECUTE'))
      FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
      WHERE (n.nspname = 'journeys' AND p.proname IN ('actor_is_administrator', 'actor_can_read_guard', 'actor_can_read_invitation', 'actor_can_read_transfer'))
        OR (n.nspname = 'sources' AND p.proname IN ('actor_has_review_access', 'actor_can_read_source', 'actor_can_export_asset', 'actor_can_read_asset', 'actor_can_read_request', 'actor_can_read_export_grant')))
    AND (SELECT count(*) = cardinality($3::text[]) FROM pg_catalog.pg_trigger AS t
      JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
      WHERE n.nspname IN ('identity', 'journeys', 'sources', 'operations') AND NOT t.tgisinternal AND t.tgenabled = 'O' AND t.tgname = ANY($3::text[]))
    AND NOT EXISTS (SELECT FROM pg_catalog.pg_constraint AS c JOIN objects AS o ON o.oid = c.conrelid
      WHERE NOT c.convalidated OR (c.contype = 'f' AND c.confdeltype <> 'r'))
    AND (SELECT count(*) = 4 FROM pg_catalog.pg_index AS i JOIN pg_catalog.pg_class AS c ON c.oid = i.indexrelid
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace WHERE n.nspname IN ('identity', 'journeys')
      AND c.relname IN ('avatar_one_available_owner', 'avatar_one_pending_owner', 'invitation_one_pending_guard', 'transfer_one_offered_journey') AND i.indisvalid AND i.indisunique AND i.indpred IS NOT NULL)
    AS valid`,
    [JSON.stringify(objects), JSON.stringify(helperColumns), guards],
  );
  if (result.rows[0]?.valid !== true)
    throw new Error("Domain foundation privileges or integrity guards are incomplete or unsafe.");
}
