-- S01 and the identity portion of S02/S06. Journey/source privileges remain closed.
REVOKE ALL ON SCHEMA authn, identity FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA authn, identity FROM PUBLIC;
GRANT USAGE ON SCHEMA authn TO kairn_auth, kairn_identity;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA authn TO kairn_auth;
GRANT SELECT (id, name, email_verified), UPDATE (id) ON authn."user" TO kairn_identity;
-- UPDATE(id) permits SELECT FOR UPDATE only in the fixed helper. Its NOLOGIN owner cannot
-- be assumed by auth/API/worker, and the helper never modifies auth fields.
GRANT USAGE ON SCHEMA identity TO kairn_auth, kairn_identity, kairn_server;
GRANT SELECT, INSERT ON identity.account, identity.profile TO kairn_identity;
GRANT SELECT ON identity.retired_auth_subject TO kairn_identity;
GRANT SELECT (id, state, revision, policy_generation, created_at, deleted_at) ON identity.account TO kairn_server;
GRANT SELECT ON identity.profile TO kairn_server;
GRANT UPDATE (display_name, bio, revision) ON identity.profile TO kairn_server;
ALTER TABLE identity.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.account FORCE ROW LEVEL SECURITY;
ALTER TABLE identity.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.profile FORCE ROW LEVEL SECURITY;
ALTER TABLE identity.retired_auth_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity.retired_auth_subject FORCE ROW LEVEL SECURITY;
-- Explicit controlled maintenance, never inherited by runtime logins.
CREATE POLICY account_migration ON identity.account TO kairn_migrator USING (true) WITH CHECK (true);
CREATE POLICY profile_migration ON identity.profile TO kairn_migrator USING (true) WITH CHECK (true);
CREATE POLICY retired_migration ON identity.retired_auth_subject TO kairn_migrator USING (true) WITH CHECK (true);
-- Acyclic graph: profile -> account -> transaction-local account context.
CREATE POLICY account_owner_read ON identity.account FOR SELECT TO kairn_server
  USING (id = (SELECT nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid) AND state = 'active');
CREATE POLICY profile_owner_read ON identity.profile FOR SELECT TO kairn_server USING (account_id IN (SELECT id FROM identity.account));
CREATE POLICY profile_owner_update ON identity.profile FOR UPDATE TO kairn_server
  USING (account_id IN (SELECT id FROM identity.account)) WITH CHECK (account_id IN (SELECT id FROM identity.account));
-- Pre-domain scope is set inside the fixed helper, which must itself pass FORCE RLS.
CREATE POLICY account_provision_read ON identity.account FOR SELECT TO kairn_identity
  USING (auth_subject_id = (SELECT pg_catalog.current_setting('kairn.verified_auth_subject', true)));
CREATE POLICY account_provision_insert ON identity.account FOR INSERT TO kairn_identity
  WITH CHECK (state = 'active' AND auth_subject_id = (SELECT pg_catalog.current_setting('kairn.verified_auth_subject', true)));
CREATE POLICY profile_provision_read ON identity.profile FOR SELECT TO kairn_identity USING (account_id IN (SELECT id FROM identity.account));
CREATE POLICY profile_provision_insert ON identity.profile FOR INSERT TO kairn_identity WITH CHECK (account_id IN (SELECT id FROM identity.account WHERE state = 'active'));
CREATE POLICY retired_provision_read ON identity.retired_auth_subject FOR SELECT TO kairn_identity
  USING (auth_subject_id = (SELECT pg_catalog.current_setting('kairn.verified_auth_subject', true)));
CREATE FUNCTION identity.ensure_account(p_subject text, p_display_name text)
RETURNS TABLE (account_id uuid, account_revision bigint, account_policy_generation bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET kairn.verified_auth_subject = '' AS $$
DECLARE v_verified boolean; v_account identity.account%ROWTYPE;
BEGIN
  IF p_subject IS NULL OR p_subject = '' OR p_display_name IS NULL THEN
    RAISE EXCEPTION 'Identity is unavailable.' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_catalog.set_config('kairn.verified_auth_subject', p_subject, true);
  -- Identity lock order: auth user, then domain account. Retirement follows the same order.
  SELECT u.email_verified INTO v_verified FROM authn."user" AS u WHERE u.id = p_subject FOR UPDATE;
  IF NOT FOUND OR NOT v_verified OR EXISTS (SELECT FROM identity.retired_auth_subject AS r WHERE r.auth_subject_id = p_subject) THEN
    RAISE EXCEPTION 'Identity is unavailable.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO identity.account (auth_subject_id) VALUES (p_subject) ON CONFLICT (auth_subject_id) DO NOTHING;
  SELECT a.* INTO STRICT v_account FROM identity.account AS a WHERE a.auth_subject_id = p_subject;
  IF v_account.state <> 'active' THEN RAISE EXCEPTION 'Identity is unavailable.' USING ERRCODE = '42501'; END IF;
  INSERT INTO identity.profile (account_id, display_name) VALUES (v_account.id, p_display_name) ON CONFLICT ON CONSTRAINT profile_pkey DO NOTHING;
  RETURN QUERY SELECT v_account.id, v_account.revision, v_account.policy_generation;
END;
$$;
REVOKE ALL ON FUNCTION identity.ensure_account(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION identity.ensure_account(text, text) TO kairn_auth;
GRANT CREATE ON SCHEMA identity TO kairn_identity;
-- Set the ACL while the migrator still owns the function. Its role membership is
-- deliberately NOINHERIT, so grants after ownership transfer would be ineffective.
ALTER FUNCTION identity.ensure_account(text, text) OWNER TO kairn_identity;
REVOKE CREATE ON SCHEMA identity FROM kairn_identity;
CREATE FUNCTION identity.check_profile_revision() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.account_id <> OLD.account_id OR NEW.revision <> OLD.revision + 1 THEN
    RAISE EXCEPTION 'Profile revision must advance once.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION identity.check_profile_revision() FROM PUBLIC;
CREATE TRIGGER profile_revision BEFORE UPDATE ON identity.profile FOR EACH ROW EXECUTE FUNCTION identity.check_profile_revision();
CREATE FUNCTION identity.check_account_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.revision <> OLD.revision + 1 OR NEW.policy_generation < OLD.policy_generation THEN
    RAISE EXCEPTION 'Account revision must advance.' USING ERRCODE = '23514';
  END IF;
  IF (OLD.state <> 'active' AND NEW.state = 'active') OR (OLD.state = 'deleted' AND NEW.state <> 'deleted')
      OR (NEW.state <> OLD.state AND NEW.policy_generation <= OLD.policy_generation) THEN
    RAISE EXCEPTION 'Account restriction cannot be reversed.' USING ERRCODE = '23514';
  END IF;
  IF NEW.auth_subject_id IS DISTINCT FROM OLD.auth_subject_id THEN
    IF NEW.auth_subject_id IS NOT NULL OR NEW.state = 'active' OR NOT EXISTS (
      SELECT FROM identity.retired_auth_subject AS r WHERE r.auth_subject_id = OLD.auth_subject_id AND r.account_id = OLD.id
    ) THEN RAISE EXCEPTION 'Auth subject must be retired before detachment.' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION identity.check_account_transition() FROM PUBLIC;
CREATE TRIGGER account_transition BEFORE UPDATE ON identity.account FOR EACH ROW EXECUTE FUNCTION identity.check_account_transition();
ALTER DEFAULT PRIVILEGES IN SCHEMA authn, identity REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
