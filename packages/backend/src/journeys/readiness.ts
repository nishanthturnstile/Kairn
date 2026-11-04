import type { PoolClient } from "pg";

/** Catalog checks need no runtime access to protected rows or helper ownership. */
export async function assertJourneyStructure(client: PoolClient) {
  const result = await client.query(`WITH tables AS (
    SELECT c.oid, c.relname, c.relowner, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_catalog.pg_class AS c JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'journeys' AND c.relname IN ('journey', 'membership', 'member_capability')
  ), helpers AS (
    SELECT p.* FROM pg_catalog.pg_proc AS p JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'journeys' AND p.proname IN ('actor_can_read_journey', 'actor_can_read_membership',
      'actor_can_read_capability', 'check_membership_transition', 'enforce_graph')
  ), expected_columns(relation, col, can_update) AS (VALUES
    ('account', 'id', false), ('account', 'state', false),
    ('journey', 'id', true), ('journey', 'lifecycle', false), ('journey', 'administration', false),
    ('membership', 'id', false), ('membership', 'journey_id', false), ('membership', 'account_id', false),
    ('membership', 'state', false), ('membership', 'epoch', false),
    ('member_capability', 'id', false), ('member_capability', 'membership_id', false),
    ('member_capability', 'journey_id', false), ('member_capability', 'membership_epoch', false),
    ('member_capability', 'capability', false), ('member_capability', 'state', false)
  ), helper_columns AS (
    SELECT c.oid, c.relname, n.nspname, a.attname FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_attribute AS a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname IN ('authn', 'identity', 'journeys') AND c.relkind IN ('r', 'p')
  ) SELECT
    (SELECT count(*) = 3 AND bool_and(relrowsecurity AND relforcerowsecurity
      AND pg_catalog.pg_get_userbyid(relowner) = 'kairn_migrator') FROM tables)
    AND EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kairn_journey_policy'
      AND NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication)
    AND NOT EXISTS (SELECT FROM pg_catalog.pg_roles AS r WHERE r.rolname IN ('kairn_server', 'kairn_worker', 'kairn_auth')
      AND (pg_catalog.pg_has_role(r.oid, 'kairn_journey_policy', 'SET') OR pg_catalog.pg_has_role(r.oid, 'kairn_journey_policy', 'USAGE')))
    AND NOT EXISTS (SELECT FROM pg_catalog.pg_namespace AS n CROSS JOIN pg_catalog.pg_roles AS r
      WHERE n.nspname IN ('journeys', 'identity', 'authn')
      AND r.rolname IN ('kairn_server', 'kairn_worker', 'kairn_auth', 'kairn_journey_policy')
      AND (pg_catalog.has_schema_privilege(r.oid, n.oid, 'CREATE')
        OR (n.nspname = 'journeys' AND r.rolname IN ('kairn_worker', 'kairn_auth') AND pg_catalog.has_schema_privilege(r.oid, n.oid, 'USAGE'))))
    AND NOT EXISTS (SELECT FROM tables WHERE NOT pg_catalog.has_table_privilege('kairn_server', oid, 'SELECT')
      OR pg_catalog.has_table_privilege('kairn_server', oid, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
    AND NOT EXISTS (SELECT FROM tables AS t CROSS JOIN pg_catalog.pg_attribute AS a
      WHERE a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
        AND pg_catalog.has_column_privilege('kairn_server', t.oid, a.attname, 'INSERT,UPDATE,REFERENCES'))
    AND NOT EXISTS (SELECT FROM tables AS t CROSS JOIN pg_catalog.pg_roles AS r
      WHERE r.rolname IN ('kairn_worker', 'kairn_auth') AND
        (pg_catalog.has_any_column_privilege(r.oid, t.oid, 'SELECT,INSERT,UPDATE,REFERENCES')
          OR pg_catalog.has_table_privilege(r.oid, t.oid, 'DELETE,TRUNCATE,TRIGGER')))
    AND NOT EXISTS (SELECT FROM helper_columns AS c LEFT JOIN expected_columns AS e ON e.relation = c.relname AND e.col = c.attname
      AND (c.nspname = 'journeys' OR (c.nspname = 'identity' AND c.relname = 'account'))
      WHERE pg_catalog.has_column_privilege('kairn_journey_policy', c.oid, c.attname, 'SELECT') IS DISTINCT FROM (e.col IS NOT NULL)
        OR pg_catalog.has_column_privilege('kairn_journey_policy', c.oid, c.attname, 'UPDATE') IS DISTINCT FROM coalesce(e.can_update, false)
        OR pg_catalog.has_column_privilege('kairn_journey_policy', c.oid, c.attname, 'INSERT,REFERENCES'))
    AND NOT EXISTS (SELECT FROM helper_columns AS c WHERE pg_catalog.has_table_privilege('kairn_journey_policy', c.oid, 'DELETE,TRUNCATE,TRIGGER'))
    AND (SELECT count(*) = 5 AND bool_and(prosecdef AND pg_catalog.pg_get_userbyid(proowner) = 'kairn_journey_policy'
      AND proconfig @> ARRAY['search_path=""', 'row_security=on']
      AND NOT pg_catalog.has_function_privilege('kairn_worker', oid, 'EXECUTE')
      AND NOT pg_catalog.has_function_privilege('kairn_auth', oid, 'EXECUTE')
      AND pg_catalog.has_function_privilege('kairn_server', oid, 'EXECUTE') = (proname LIKE 'actor_can_read_%')) FROM helpers)
    AND (SELECT count(*) = 6 FROM pg_catalog.pg_trigger AS t JOIN tables AS c ON c.oid = t.tgrelid
      JOIN pg_catalog.pg_proc AS p ON p.oid = t.tgfoid
      WHERE NOT t.tgisinternal AND t.tgenabled = 'O' AND (
        (t.tgname = 'journey_write' AND c.relname = 'journey' AND p.proname = 'check_journey_write' AND NOT t.tgdeferrable)
        OR (t.tgname = 'membership_transition' AND c.relname = 'membership' AND p.proname = 'check_membership_transition' AND NOT t.tgdeferrable)
        OR (t.tgname = 'capability_transition' AND c.relname = 'member_capability' AND p.proname = 'check_capability_transition' AND NOT t.tgdeferrable)
        OR (t.tgname IN ('journey_graph', 'membership_graph', 'capability_graph') AND p.proname = 'enforce_graph' AND t.tgdeferrable AND t.tginitdeferred)))
    AND EXISTS (SELECT FROM pg_catalog.pg_index AS i JOIN pg_catalog.pg_class AS c ON c.oid = i.indexrelid
      JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
      WHERE n.nspname = 'journeys' AND c.relname = 'journey_one_active_administrator'
        AND i.indisunique AND i.indisvalid AND i.indisready AND i.indpred IS NOT NULL)
    AS valid`);
  if (result.rows[0]?.valid !== true)
    throw new Error("Journey privileges or integrity guards are incomplete or unsafe.");
}
