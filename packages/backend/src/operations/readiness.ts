import { createHash } from "node:crypto";
import type { PoolClient } from "pg";

export async function domainBoundaryHash(client: PoolClient) {
  const result = await client.query(
    `WITH namespaces AS(SELECT oid FROM pg_catalog.pg_namespace WHERE nspname IN ('authn','identity','journeys','sources','operations'))
    SELECT pg_catalog.jsonb_build_object(
      'functions',(SELECT jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,'definition',pg_catalog.pg_get_functiondef(p.oid),'owner',pg_catalog.pg_get_userbyid(p.proowner),'acl',p.proacl::text) ORDER BY p.oid::regprocedure::text) FROM pg_catalog.pg_proc p WHERE p.pronamespace IN(SELECT oid FROM namespaces)),
      'tables',(SELECT jsonb_agg(jsonb_build_object('name',c.oid::regclass::text,'owner',pg_catalog.pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'acl',c.relacl::text) ORDER BY c.oid::regclass::text) FROM pg_catalog.pg_class c WHERE c.relnamespace IN(SELECT oid FROM namespaces) AND c.relkind IN ('r','S')),
      'columns',(SELECT jsonb_agg(jsonb_build_object('table',c.oid::regclass::text,'column',a.attname,'acl',a.attacl::text,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'required',a.attnotnull) ORDER BY c.oid::regclass::text,a.attnum) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid WHERE c.relnamespace IN(SELECT oid FROM namespaces) AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped),
      'indexes',(SELECT jsonb_agg(pg_catalog.pg_get_indexdef(i.indexrelid) ORDER BY c.oid::regclass::text) FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid=i.indexrelid WHERE c.relnamespace IN(SELECT oid FROM namespaces)),
      'constraints',(SELECT jsonb_agg(jsonb_build_array(c.conrelid::regclass::text,c.conname,pg_catalog.pg_get_constraintdef(c.oid),c.convalidated) ORDER BY c.conrelid::regclass::text,c.conname) FROM pg_catalog.pg_constraint c WHERE c.connamespace IN(SELECT oid FROM namespaces)),
      'triggers',(SELECT jsonb_agg(pg_catalog.pg_get_triggerdef(t.oid) ORDER BY c.oid::regclass::text,t.tgname) FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace IN(SELECT oid FROM namespaces) AND NOT t.tgisinternal)
    )::text AS definition`,
  );
  return createHash("sha256").update(result.rows[0].definition).digest("hex");
}
export async function assertCommandStructure(client: PoolClient) {
  const result = await client.query(`SELECT
 EXISTS(SELECT FROM pg_catalog.pg_roles WHERE rolname='kairn_command' AND NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication)
 AND pg_catalog.has_schema_privilege('kairn_auth','operations','USAGE') AND pg_catalog.has_schema_privilege('kairn_worker','operations','USAGE')
 AND NOT pg_catalog.has_schema_privilege('kairn_auth','sources','USAGE') AND NOT pg_catalog.has_schema_privilege('kairn_worker','sources','USAGE')
 AND NOT EXISTS(SELECT FROM pg_catalog.pg_roles r WHERE r.rolname IN ('kairn_server','kairn_auth','kairn_worker') AND (pg_catalog.pg_has_role(r.oid,'kairn_command','SET') OR pg_catalog.pg_has_role(r.oid,'kairn_command','USAGE')))
 AND NOT EXISTS(SELECT FROM pg_catalog.pg_namespace n WHERE n.nspname IN ('authn','identity','journeys','sources','operations') AND pg_catalog.has_schema_privilege('kairn_command',n.oid,'CREATE'))
 AND NOT EXISTS(SELECT FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace CROSS JOIN pg_catalog.pg_roles r WHERE n.nspname='operations' AND r.rolname IN ('kairn_server','kairn_auth','kairn_worker') AND pg_catalog.has_function_privilege(r.oid,p.oid,'EXECUTE') IS DISTINCT FROM
 CASE r.rolname WHEN 'kairn_server' THEN p.proname IN ('execute_command','preview_impact','restriction_status','consume_budget','avatar_target','read_avatar','record_avatar_upload') WHEN 'kairn_auth' THEN p.proname IN ('enqueue_auth_email','consume_budget') ELSE p.proname IN ('mail_failure','reset_mail_token_current','retention_unit','mark_avatar_quarantine_purged','restored_cleanup_targets','pending_work','pending_restriction','confirm_restriction','restriction_failed','claim_email','finish_email','purge_expired_mail','avatar_target','complete_avatar','fail_avatar','avatar_cleanup_batch','finish_avatar_cleanup','account_cleanup_unit','cleanup_unit') END)
 AND (SELECT count(*)=2 AND bool_and(c.relrowsecurity AND c.relforcerowsecurity AND pg_catalog.pg_get_userbyid(c.relowner)='kairn_migrator') FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='operations' AND c.relname IN ('recovery_barrier','recovery_checkpoint'))
 AND NOT EXISTS(SELECT FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace CROSS JOIN pg_catalog.pg_roles r WHERE n.nspname='operations' AND c.relname IN ('recovery_barrier','recovery_checkpoint') AND r.rolname IN ('kairn_server','kairn_auth','kairn_worker') AND pg_catalog.has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')) AS valid`);
  if (result.rows[0]?.valid !== true)
    throw new Error("Domain command privileges are incomplete or unsafe.");
  const expected = await client.query(
    "SELECT boundary_sha256 FROM kairn_migrations.identity_release ORDER BY position DESC LIMIT 1",
  );
  if (expected.rows[0]?.boundary_sha256 !== (await domainBoundaryHash(client)))
    throw new Error("Domain integrity definitions differ from the applied release.");
}
