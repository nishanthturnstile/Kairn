-- B02 S02-S06. All product command writers stay closed until B03 installs its
-- receipt/audit/policy/restriction coordinators. These are private relational models.
REVOKE ALL ON SCHEMA sources, operations FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA sources, operations FROM PUBLIC;
REVOKE ALL ON identity.profile_avatar, journeys.recipient_guard, journeys.invitation, journeys.administration_transfer FROM PUBLIC;
GRANT USAGE ON SCHEMA identity, journeys, sources TO kairn_access_policy;
GRANT USAGE ON SCHEMA sources, operations TO kairn_server;
GRANT SELECT (id, state) ON identity.account TO kairn_access_policy;
GRANT SELECT (id, lifecycle, administration) ON journeys.journey TO kairn_access_policy;
GRANT SELECT (id, journey_id, account_id, epoch, state) ON journeys.membership TO kairn_access_policy;
GRANT SELECT (id, membership_id, journey_id, membership_epoch, capability, state) ON journeys.member_capability TO kairn_access_policy;
GRANT SELECT (id, journey_id, bound_account_id) ON journeys.recipient_guard TO kairn_access_policy;
GRANT SELECT (id, journey_id, guard_id) ON journeys.invitation TO kairn_access_policy;
GRANT SELECT (id, journey_id, target_membership_id, target_account_id, target_epoch) ON journeys.administration_transfer TO kairn_access_policy;
GRANT SELECT (id, owner_account_id, state) ON sources.source TO kairn_access_policy;
GRANT SELECT (id, source_id, owner_account_id, purpose, state, revision) ON sources.source_asset TO kairn_access_policy;
GRANT SELECT (id, source_id, owner_account_id, journey_id, scope, state, revision) ON sources.source_grant TO kairn_access_policy;
GRANT SELECT (id, owner_account_id, journey_id, requester_account_id, requester_membership_id, requester_epoch) ON sources.export_request TO kairn_access_policy;
GRANT SELECT (id, owner_account_id, journey_id, recipient_account_id, recipient_membership_id, recipient_epoch, state, expires_at) ON sources.export_grant TO kairn_access_policy;
GRANT SELECT (grant_id, asset_id, source_id, source_grant_id, owner_account_id, journey_id, asset_revision, source_grant_revision) ON sources.export_grant_asset TO kairn_access_policy;

DO $$ DECLARE v record; BEGIN
  FOR v IN SELECT schemaname, tablename FROM pg_catalog.pg_tables WHERE
      (schemaname = 'identity' AND tablename = 'profile_avatar')
      OR (schemaname = 'journeys' AND tablename IN ('recipient_guard', 'invitation', 'administration_transfer'))
      OR schemaname IN ('sources', 'operations') LOOP
    EXECUTE pg_catalog.format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', v.schemaname, v.tablename);
    EXECUTE pg_catalog.format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY', v.schemaname, v.tablename);
    EXECUTE pg_catalog.format('CREATE POLICY foundation_migration ON %I.%I TO kairn_migrator USING (true) WITH CHECK (true)', v.schemaname, v.tablename);
  END LOOP;
  FOR v IN SELECT DISTINCT n.nspname, c.relname FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname IN ('identity', 'journeys', 'sources') AND c.relkind = 'r'
      AND pg_catalog.has_any_column_privilege('kairn_access_policy', c.oid, 'SELECT') LOOP
    EXECUTE pg_catalog.format('CREATE POLICY access_lookup ON %I.%I FOR SELECT TO kairn_access_policy USING (true)', v.nspname, v.relname);
  END LOOP;
END $$;

CREATE FUNCTION journeys.actor_is_administrator(p_journey uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM journeys.membership AS m
    JOIN identity.account AS a ON a.id = m.account_id AND a.state = 'active'
    JOIN journeys.journey AS j ON j.id = m.journey_id AND j.lifecycle <> 'deleted'
    JOIN journeys.member_capability AS c ON c.membership_id = m.id AND c.membership_epoch = m.epoch AND c.capability = 'administrator' AND c.state = 'active'
    WHERE m.journey_id = p_journey AND m.state = 'active' AND a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid);
$$;
CREATE FUNCTION journeys.actor_can_read_guard(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM journeys.recipient_guard AS g
    JOIN identity.account AS a ON a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid AND a.state = 'active'
    WHERE g.id = p_id AND (g.bound_account_id = a.id OR journeys.actor_is_administrator(g.journey_id)));
$$;
CREATE FUNCTION journeys.actor_can_read_invitation(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM journeys.invitation AS i WHERE i.id = p_id AND journeys.actor_can_read_guard(i.guard_id));
$$;
CREATE FUNCTION journeys.actor_can_read_transfer(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM journeys.administration_transfer AS t
    JOIN identity.account AS a ON a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid AND a.state = 'active'
    WHERE t.id = p_id AND (journeys.actor_is_administrator(t.journey_id) OR EXISTS (
      SELECT FROM journeys.membership AS m JOIN journeys.journey AS j ON j.id = m.journey_id AND j.lifecycle <> 'deleted'
      WHERE m.id = t.target_membership_id AND m.account_id = a.id AND m.epoch = t.target_epoch AND m.state = 'active')));
$$;
CREATE FUNCTION sources.actor_has_review_access(p_source uuid, p_journey uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM sources.source AS s
    JOIN identity.account AS owner ON owner.id = s.owner_account_id AND owner.state = 'active'
    JOIN sources.source_grant AS g ON g.source_id = s.id AND g.owner_account_id = s.owner_account_id AND g.state = 'active' AND g.scope IN ('journey_review', 'publication_reuse')
    JOIN journeys.journey AS j ON j.id = g.journey_id AND j.lifecycle <> 'deleted'
    JOIN journeys.membership AS m ON m.journey_id = j.id AND m.state = 'active'
    JOIN identity.account AS a ON a.id = m.account_id AND a.state = 'active'
    JOIN journeys.member_capability AS c ON c.membership_id = m.id AND c.membership_epoch = m.epoch AND c.state = 'active' AND c.capability IN ('coauthor', 'publisher')
    WHERE s.id = p_source AND s.state = 'active' AND j.id = p_journey AND a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid);
$$;
CREATE FUNCTION sources.actor_can_read_source(p_source uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM sources.source AS s
    JOIN identity.account AS a ON a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid AND a.state = 'active'
    WHERE s.id = p_source AND s.state = 'active' AND (s.owner_account_id = a.id OR EXISTS (
      SELECT FROM sources.source_grant AS g WHERE g.source_id = s.id AND sources.actor_has_review_access(s.id, g.journey_id))));
$$;
CREATE FUNCTION sources.actor_can_export_asset(p_asset uuid, p_grant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM sources.export_grant AS g
    JOIN identity.account AS actor ON actor.id = g.recipient_account_id AND actor.state = 'active'
    JOIN identity.account AS owner ON owner.id = g.owner_account_id AND owner.state = 'active'
    JOIN journeys.journey AS j ON j.id = g.journey_id AND j.lifecycle <> 'deleted'
    JOIN journeys.membership AS m ON m.id = g.recipient_membership_id AND m.journey_id = g.journey_id AND m.account_id = actor.id AND m.epoch = g.recipient_epoch AND m.state = 'active'
    JOIN sources.export_grant_asset AS b ON b.grant_id = g.id AND b.asset_id = p_asset AND b.owner_account_id = g.owner_account_id AND b.journey_id = g.journey_id
    JOIN sources.source_asset AS a ON a.id = b.asset_id AND a.source_id = b.source_id AND a.owner_account_id = g.owner_account_id AND a.state = 'verified' AND a.purpose = 'original' AND a.revision = b.asset_revision
    JOIN sources.source AS s ON s.id = a.source_id AND s.owner_account_id = a.owner_account_id AND s.state = 'active'
    JOIN sources.source_grant AS sg ON sg.id = b.source_grant_id AND sg.source_id = s.id AND sg.journey_id = g.journey_id AND sg.owner_account_id = g.owner_account_id AND sg.revision = b.source_grant_revision AND sg.state = 'active' AND sg.scope IN ('journey_review', 'publication_reuse')
    WHERE g.id = p_grant AND g.state = 'active' AND g.expires_at > pg_catalog.clock_timestamp()
      AND actor.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid);
$$;
CREATE FUNCTION sources.actor_can_read_asset(p_asset uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM sources.source_asset AS a WHERE a.id = p_asset AND a.state IN ('registered', 'verified') AND
    (sources.actor_can_read_source(a.source_id) OR EXISTS (SELECT FROM sources.export_grant_asset AS b WHERE b.asset_id = a.id AND sources.actor_can_export_asset(a.id, b.grant_id))));
$$;
CREATE FUNCTION sources.actor_can_read_request(p_request uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM sources.export_request AS r
    JOIN identity.account AS a ON a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid AND a.state = 'active'
    WHERE r.id = p_request AND (r.owner_account_id = a.id OR EXISTS (
      SELECT FROM journeys.membership AS m JOIN journeys.journey AS j ON j.id = m.journey_id AND j.lifecycle <> 'deleted'
      WHERE m.id = r.requester_membership_id AND m.account_id = a.id AND m.epoch = r.requester_epoch AND m.state = 'active')));
$$;
CREATE FUNCTION sources.actor_can_read_export_grant(p_grant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (SELECT FROM sources.export_grant AS g
    JOIN identity.account AS a ON a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid AND a.state = 'active'
    WHERE g.id = p_grant AND (g.owner_account_id = a.id OR EXISTS (
      SELECT FROM sources.export_grant_asset AS b WHERE b.grant_id = g.id AND sources.actor_can_export_asset(b.asset_id, g.id))));
$$;
-- Install ACLs before transferring ownership to the non-inherited lookup role.
DO $$ DECLARE v record; BEGIN
  GRANT CREATE ON SCHEMA journeys, sources TO kairn_access_policy;
  FOR v IN SELECT p.oid::regprocedure AS signature FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE (n.nspname = 'journeys' AND p.proname IN ('actor_is_administrator', 'actor_can_read_guard', 'actor_can_read_invitation', 'actor_can_read_transfer'))
      OR (n.nspname = 'sources' AND p.proname IN ('actor_has_review_access', 'actor_can_read_source', 'actor_can_export_asset', 'actor_can_read_asset', 'actor_can_read_request', 'actor_can_read_export_grant')) LOOP
    EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', v.signature);
    EXECUTE pg_catalog.format('GRANT EXECUTE ON FUNCTION %s TO kairn_server', v.signature);
    EXECUTE pg_catalog.format('ALTER FUNCTION %s OWNER TO kairn_access_policy', v.signature);
  END LOOP;
  REVOKE CREATE ON SCHEMA journeys, sources FROM kairn_access_policy;
END $$;
GRANT SELECT (id, owner_account_id, failure_code, state, revision, representation_content_type, representation_bytes, representation_sha256, width, height, created_at, upload_expires_at, deleted_at) ON identity.profile_avatar TO kairn_server;
GRANT SELECT (id, journey_id, bound_account_id, admission_epoch, revision, last_ended_at, created_at) ON journeys.recipient_guard TO kairn_server;
GRANT SELECT (id, journey_id, guard_id, admission_epoch, inviter_membership_id, inviter_account_id, inviter_membership_epoch, offered_coauthor, offered_publisher, state, revision, created_at, expires_at, closed_at, accepted_account_id, accepted_membership_id, accepted_membership_epoch) ON journeys.invitation TO kairn_server;
GRANT SELECT ON journeys.administration_transfer TO kairn_server;
GRANT SELECT ON ALL TABLES IN SCHEMA sources TO kairn_server;
CREATE POLICY avatar_own_read ON identity.profile_avatar FOR SELECT TO kairn_server USING (owner_account_id IN (SELECT id FROM identity.account));
CREATE POLICY guard_scoped_read ON journeys.recipient_guard FOR SELECT TO kairn_server USING (journeys.actor_can_read_guard(id));
CREATE POLICY invitation_scoped_read ON journeys.invitation FOR SELECT TO kairn_server USING (journeys.actor_can_read_invitation(id));
CREATE POLICY transfer_scoped_read ON journeys.administration_transfer FOR SELECT TO kairn_server USING (journeys.actor_can_read_transfer(id));
CREATE POLICY source_scoped_read ON sources.source FOR SELECT TO kairn_server USING (sources.actor_can_read_source(id));
CREATE POLICY asset_scoped_read ON sources.source_asset FOR SELECT TO kairn_server USING (sources.actor_can_read_asset(id));
CREATE POLICY source_grant_scoped_read ON sources.source_grant FOR SELECT TO kairn_server USING (owner_account_id IN (SELECT id FROM identity.account) OR sources.actor_has_review_access(source_id, journey_id));
CREATE POLICY export_request_scoped_read ON sources.export_request FOR SELECT TO kairn_server USING (sources.actor_can_read_request(id));
CREATE POLICY request_asset_scoped_read ON sources.export_request_asset FOR SELECT TO kairn_server USING (sources.actor_can_read_request(request_id));
CREATE POLICY export_grant_scoped_read ON sources.export_grant FOR SELECT TO kairn_server USING (sources.actor_can_read_export_grant(id));
CREATE POLICY grant_asset_scoped_read ON sources.export_grant_asset FOR SELECT TO kairn_server USING (owner_account_id IN (SELECT id FROM identity.account) OR sources.actor_can_export_asset(asset_id, grant_id));

GRANT SELECT ON operations.command_receipt, operations.audit_event, operations.domain_change, operations.restriction_event, operations.restriction_delivery TO kairn_server;
GRANT SELECT (id, actor_account_id, action, journey_id, target_account_id, target_membership_id, target_revision, policy_generation, impact_digest, created_at, expires_at, consumed_command_id, consumed_at) ON operations.impact_preview TO kairn_server;
GRANT SELECT (id, actor_account_id, command_id, action, resource_kind, resource_id, journey_id, target_account_id, target_membership_id, impact_digest, target_revision, policy_generation, state, recovery_state, processed_units, total_units, next_unit_id, revision, error_code, created_at, updated_at, receipt_hard_expires_at, terminal_at, terminal_available_until) ON operations.lifecycle_operation TO kairn_server;
GRANT SELECT (id, recipient_account_id, created_at, read_at, revision) ON operations.account_notice TO kairn_server;
GRANT SELECT (event_id, sequence, checkpoint_sha256, event_sha256, confirmed_at) ON operations.restriction_receipt TO kairn_server;
-- Append-only ACLs, with an explicit closed write policy until B03 qualification.
GRANT INSERT ON operations.audit_event, operations.domain_change, operations.restriction_event TO kairn_server;
CREATE POLICY audit_writer_closed ON operations.audit_event FOR INSERT TO kairn_server WITH CHECK (false);
CREATE POLICY change_writer_closed ON operations.domain_change FOR INSERT TO kairn_server WITH CHECK (false);
CREATE POLICY restriction_writer_closed ON operations.restriction_event FOR INSERT TO kairn_server WITH CHECK (false);
CREATE POLICY command_own_read ON operations.command_receipt FOR SELECT TO kairn_server USING (actor_account_id IN (SELECT id FROM identity.account));
CREATE POLICY impact_own_read ON operations.impact_preview FOR SELECT TO kairn_server USING (actor_account_id IN (SELECT id FROM identity.account));
CREATE POLICY lifecycle_own_read ON operations.lifecycle_operation FOR SELECT TO kairn_server USING (actor_account_id IN (SELECT id FROM identity.account));
CREATE POLICY audit_scoped_read ON operations.audit_event FOR SELECT TO kairn_server USING (
  (actor_account_id IN (SELECT id FROM identity.account) OR subject_account_id IN (SELECT id FROM identity.account))
  AND (journey_id IS NULL OR journeys.actor_can_read_journey(journey_id)) AND (source_id IS NULL OR sources.actor_can_read_source(source_id)));
CREATE POLICY notice_own_read ON operations.account_notice FOR SELECT TO kairn_server USING (recipient_account_id IN (SELECT id FROM identity.account));
CREATE POLICY change_scoped_read ON operations.domain_change FOR SELECT TO kairn_server USING (
  (scope = 'account' AND account_id IN (SELECT id FROM identity.account)) OR (scope = 'journey' AND journeys.actor_can_read_journey(journey_id)));
CREATE POLICY restriction_own_read ON operations.restriction_event FOR SELECT TO kairn_server USING (operation_id IN (SELECT id FROM operations.lifecycle_operation));
CREATE POLICY receipt_own_read ON operations.restriction_receipt FOR SELECT TO kairn_server USING (event_id IN (SELECT id FROM operations.restriction_event));
CREATE POLICY delivery_own_read ON operations.restriction_delivery FOR SELECT TO kairn_server USING (event_id IN (SELECT id FROM operations.restriction_event));
ALTER DEFAULT PRIVILEGES IN SCHEMA sources, operations REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Identity/media selection is always owner-bound and refers only to a sanitized current avatar.
CREATE FUNCTION identity.check_avatar_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.owner_account_id <> OLD.owner_account_id OR NEW.created_at <> OLD.created_at
      OR NEW.quarantine_bucket <> OLD.quarantine_bucket OR NEW.quarantine_key <> OLD.quarantine_key
      OR NEW.input_content_type <> OLD.input_content_type OR NEW.input_bytes <> OLD.input_bytes OR NEW.input_sha256 <> OLD.input_sha256
      OR NEW.upload_expires_at <> OLD.upload_expires_at OR NEW.revision <> OLD.revision + 1
      OR (OLD.state = 'deleted' AND NEW IS DISTINCT FROM OLD)
      OR (OLD.state IN ('failed', 'superseded', 'deleting') AND NEW.state NOT IN (OLD.state, 'deleting', 'deleted'))
      OR (OLD.state = 'available' AND NEW.state NOT IN ('available', 'superseded', 'deleting', 'deleted'))
      OR (OLD.state = 'processing' AND NEW.state NOT IN ('processing', 'available', 'failed', 'deleting', 'deleted'))
      OR (OLD.state = 'quarantined' AND NEW.state NOT IN ('quarantined', 'processing', 'failed', 'deleting', 'deleted'))
      OR (OLD.state = 'pending' AND NEW.state NOT IN ('pending', 'quarantined', 'failed', 'deleting', 'deleted')) THEN
    RAISE EXCEPTION 'Invalid avatar transition.' USING ERRCODE = '23514';
  END IF;
  IF OLD.representation_key IS NOT NULL AND ROW(NEW.representation_bucket, NEW.representation_key, NEW.representation_content_type, NEW.representation_bytes, NEW.representation_sha256, NEW.width, NEW.height)
      IS DISTINCT FROM ROW(OLD.representation_bucket, OLD.representation_key, OLD.representation_content_type, OLD.representation_bytes, OLD.representation_sha256, OLD.width, OLD.height) THEN
    RAISE EXCEPTION 'Sanitized avatar representation is immutable.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER avatar_transition BEFORE UPDATE ON identity.profile_avatar FOR EACH ROW EXECUTE FUNCTION identity.check_avatar_transition();
CREATE FUNCTION identity.enforce_avatar_selection() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_owner uuid;
BEGIN
  IF TG_TABLE_NAME = 'profile' THEN
    IF NEW.avatar_id IS NULL THEN RETURN NULL; END IF;
    v_owner := NEW.account_id;
  ELSE v_owner := NEW.owner_account_id; END IF;
  IF EXISTS (SELECT FROM identity.profile AS p LEFT JOIN identity.profile_avatar AS a ON a.id = p.avatar_id AND a.owner_account_id = p.account_id
      WHERE p.account_id = v_owner AND p.avatar_id IS NOT NULL AND (a.id IS NULL OR a.state <> 'available')) THEN
    RAISE EXCEPTION 'Profile requires its current sanitized avatar.' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER profile_avatar_selection AFTER INSERT OR UPDATE ON identity.profile DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION identity.enforce_avatar_selection();
CREATE CONSTRAINT TRIGGER avatar_selection AFTER INSERT OR UPDATE ON identity.profile_avatar DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION identity.enforce_avatar_selection();

CREATE FUNCTION journeys.check_guard_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.journey_id <> OLD.journey_id OR NEW.recipient_key <> OLD.recipient_key OR NEW.created_at <> OLD.created_at
      OR NEW.revision <> OLD.revision + 1 OR NEW.admission_epoch NOT IN (OLD.admission_epoch, OLD.admission_epoch + 1)
      OR (OLD.bound_account_id IS NOT NULL AND NEW.bound_account_id IS DISTINCT FROM OLD.bound_account_id)
      OR (OLD.recipient_email IS DISTINCT FROM NEW.recipient_email AND NEW.recipient_email IS NOT NULL)
      OR (OLD.last_ended_at IS NOT NULL AND (NEW.last_ended_at IS NULL OR NEW.last_ended_at < OLD.last_ended_at))
      OR (NEW.last_ended_at IS DISTINCT FROM OLD.last_ended_at AND NEW.admission_epoch <> OLD.admission_epoch + 1) THEN
    RAISE EXCEPTION 'Recipient identity or admission barrier cannot be reset.' USING ERRCODE = '23514';
  END IF;
  IF NEW.recipient_email IS NULL AND EXISTS (SELECT FROM journeys.invitation WHERE guard_id = OLD.id AND state = 'pending') THEN
    RAISE EXCEPTION 'Pending recipient delivery cannot be purged.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_transition BEFORE UPDATE ON journeys.recipient_guard FOR EACH ROW EXECUTE FUNCTION journeys.check_guard_transition();
CREATE FUNCTION journeys.invalidate_guard_offers() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.admission_epoch <> OLD.admission_epoch THEN
    UPDATE journeys.invitation SET state = CASE WHEN NEW.last_ended_at IS DISTINCT FROM OLD.last_ended_at THEN 'revoked' ELSE 'superseded' END,
      closed_at = pg_catalog.clock_timestamp(), revision = revision + 1 WHERE guard_id = NEW.id AND state = 'pending' AND admission_epoch <> NEW.admission_epoch;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER guard_invalidation AFTER UPDATE ON journeys.recipient_guard FOR EACH ROW EXECUTE FUNCTION journeys.invalidate_guard_offers();
CREATE FUNCTION journeys.check_invitation_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_guard journeys.recipient_guard%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'pending' OR NEW.revision <> 1 THEN RAISE EXCEPTION 'Invitation must begin pending.' USING ERRCODE = '23514'; END IF;
  ELSE
    IF ROW(NEW.id, NEW.journey_id, NEW.guard_id, NEW.admission_epoch, NEW.inviter_membership_id, NEW.inviter_account_id, NEW.inviter_membership_epoch, NEW.secret_hash, NEW.offered_coauthor, NEW.offered_publisher, NEW.created_at, NEW.expires_at)
        IS DISTINCT FROM ROW(OLD.id, OLD.journey_id, OLD.guard_id, OLD.admission_epoch, OLD.inviter_membership_id, OLD.inviter_account_id, OLD.inviter_membership_epoch, OLD.secret_hash, OLD.offered_coauthor, OLD.offered_publisher, OLD.created_at, OLD.expires_at)
        OR NEW.revision <> OLD.revision + 1 OR (OLD.state <> 'pending' AND ROW(NEW.state, NEW.closed_at, NEW.accepted_account_id, NEW.accepted_membership_id, NEW.accepted_membership_epoch) IS DISTINCT FROM ROW(OLD.state, OLD.closed_at, OLD.accepted_account_id, OLD.accepted_membership_id, OLD.accepted_membership_epoch)) THEN
      RAISE EXCEPTION 'Invitation offers cannot be rewritten or revived.' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW.state IN ('pending', 'accepted') AND (TG_OP = 'INSERT' OR OLD.state = 'pending') THEN
    SELECT * INTO STRICT v_guard FROM journeys.recipient_guard WHERE id = NEW.guard_id;
    IF NEW.expires_at <= pg_catalog.clock_timestamp() OR NEW.admission_epoch <> v_guard.admission_epoch
        OR (v_guard.last_ended_at IS NOT NULL AND NEW.created_at <= v_guard.last_ended_at)
        OR NOT EXISTS (SELECT FROM journeys.journey AS j
          JOIN journeys.membership AS m ON m.journey_id = j.id AND m.id = NEW.inviter_membership_id AND m.account_id = NEW.inviter_account_id AND m.epoch = NEW.inviter_membership_epoch AND m.state = 'active'
          JOIN identity.account AS a ON a.id = m.account_id AND a.state = 'active'
          JOIN journeys.member_capability AS c ON c.membership_id = m.id AND c.membership_epoch = m.epoch AND c.capability = 'administrator' AND c.state = 'active'
          WHERE j.id = NEW.journey_id AND j.lifecycle = 'active' AND j.administration = 'assigned') THEN
      RAISE EXCEPTION 'Invitation admission or authority is unavailable.' USING ERRCODE = '23514';
    END IF;
    IF NEW.state = 'accepted' AND (v_guard.bound_account_id IS DISTINCT FROM NEW.accepted_account_id OR NOT EXISTS (
      SELECT FROM journeys.membership AS m JOIN identity.account AS a ON a.id = m.account_id AND a.state = 'active'
      WHERE m.id = NEW.accepted_membership_id AND m.journey_id = NEW.journey_id AND m.account_id = NEW.accepted_account_id
        AND m.epoch = NEW.accepted_membership_epoch AND m.state = 'active' AND m.joined_at >= NEW.created_at)) THEN
      RAISE EXCEPTION 'Acceptance requires the bound current new membership.' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER invitation_transition BEFORE INSERT OR UPDATE ON journeys.invitation FOR EACH ROW EXECUTE FUNCTION journeys.check_invitation_transition();
CREATE FUNCTION journeys.invalidate_ended_membership() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF OLD.state = 'active' AND NEW.state <> 'active' THEN
    UPDATE journeys.recipient_guard SET admission_epoch = admission_epoch + 1, last_ended_at = NEW.ended_at, revision = revision + 1
      WHERE journey_id = NEW.journey_id AND bound_account_id = NEW.account_id;
    UPDATE journeys.administration_transfer SET state = 'invalidated', closed_at = pg_catalog.clock_timestamp(), revision = revision + 1
      WHERE state = 'offered' AND (offering_membership_id = NEW.id OR target_membership_id = NEW.id);
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER membership_admission_end AFTER UPDATE ON journeys.membership FOR EACH ROW EXECUTE FUNCTION journeys.invalidate_ended_membership();
CREATE FUNCTION journeys.invalidate_lost_administration() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF OLD.capability = 'administrator' AND OLD.state = 'active' AND NEW.state <> 'active' THEN
    UPDATE journeys.recipient_guard AS g SET admission_epoch = admission_epoch + 1, revision = revision + 1
      WHERE EXISTS (SELECT FROM journeys.invitation AS i WHERE i.guard_id = g.id AND i.inviter_membership_id = OLD.membership_id AND i.state = 'pending');
    UPDATE journeys.administration_transfer SET state = 'invalidated', closed_at = pg_catalog.clock_timestamp(), revision = revision + 1
      WHERE offering_membership_id = OLD.membership_id AND state = 'offered';
  END IF;
  IF OLD.capability = 'coauthor' AND OLD.state = 'active' AND NEW.state <> 'active' THEN
    UPDATE journeys.administration_transfer SET state = 'invalidated', closed_at = pg_catalog.clock_timestamp(), revision = revision + 1
      WHERE target_membership_id = OLD.membership_id AND state = 'offered';
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER administrator_offer_end AFTER UPDATE ON journeys.member_capability FOR EACH ROW EXECUTE FUNCTION journeys.invalidate_lost_administration();
CREATE FUNCTION journeys.invalidate_closed_journey() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (OLD.lifecycle = 'active' AND NEW.lifecycle <> 'active') OR (OLD.administration = 'assigned' AND NEW.administration = 'frozen') THEN
    UPDATE journeys.recipient_guard SET admission_epoch = admission_epoch + 1, revision = revision + 1 WHERE journey_id = NEW.id;
    UPDATE journeys.administration_transfer SET state = 'invalidated', closed_at = pg_catalog.clock_timestamp(), revision = revision + 1 WHERE journey_id = NEW.id AND state = 'offered';
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER journey_offer_end AFTER UPDATE ON journeys.journey FOR EACH ROW EXECUTE FUNCTION journeys.invalidate_closed_journey();
CREATE FUNCTION journeys.check_transfer_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'offered' OR NEW.revision <> 1 THEN RAISE EXCEPTION 'Transfer must begin offered.' USING ERRCODE = '23514'; END IF;
  ELSE
    IF (pg_catalog.to_jsonb(NEW) - ARRAY['revision', 'state', 'closed_at']) IS DISTINCT FROM (pg_catalog.to_jsonb(OLD) - ARRAY['revision', 'state', 'closed_at'])
        OR NEW.revision <> OLD.revision + 1 OR (OLD.state <> 'offered' AND ROW(NEW.state, NEW.closed_at) IS DISTINCT FROM ROW(OLD.state, OLD.closed_at)) THEN
      RAISE EXCEPTION 'Transfer cannot be rewritten or revived.' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW.state IN ('offered', 'accepted') AND (TG_OP = 'INSERT' OR OLD.state = 'offered') THEN
    IF NEW.expires_at <= pg_catalog.clock_timestamp() OR NOT EXISTS (
      SELECT FROM journeys.journey AS j
      JOIN journeys.membership AS offering ON offering.id = NEW.offering_membership_id AND offering.journey_id = j.id AND offering.account_id = NEW.offering_account_id AND offering.epoch = NEW.offering_epoch AND offering.state = 'active'
      JOIN identity.account AS oa ON oa.id = offering.account_id AND oa.state = 'active'
      JOIN journeys.member_capability AS admin ON admin.membership_id = offering.id AND admin.membership_epoch = offering.epoch AND admin.capability = 'administrator' AND admin.state = 'active'
      JOIN journeys.membership AS target ON target.id = NEW.target_membership_id AND target.journey_id = j.id AND target.account_id = NEW.target_account_id AND target.epoch = NEW.target_epoch AND target.state = 'active'
      JOIN identity.account AS ta ON ta.id = target.account_id AND ta.state = 'active'
      JOIN journeys.member_capability AS coauthor ON coauthor.membership_id = target.id AND coauthor.membership_epoch = target.epoch AND coauthor.capability = 'coauthor' AND coauthor.state = 'active'
      WHERE j.id = NEW.journey_id AND j.lifecycle <> 'deleted' AND j.administration = 'assigned' AND j.policy_generation = NEW.journey_policy_generation
    ) THEN RAISE EXCEPTION 'Transfer authority or target is stale.' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER transfer_transition BEFORE INSERT OR UPDATE ON journeys.administration_transfer FOR EACH ROW EXECUTE FUNCTION journeys.check_transfer_transition();
CREATE FUNCTION journeys.enforce_transfer_acceptance() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF EXISTS (SELECT FROM journeys.administration_transfer AS t WHERE t.id = NEW.id AND t.state = 'accepted' AND NOT EXISTS (
    SELECT FROM journeys.journey AS j JOIN journeys.membership AS m ON m.id = t.target_membership_id AND m.journey_id = j.id AND m.epoch = t.target_epoch AND m.state = 'active'
    JOIN journeys.member_capability AS c ON c.membership_id = m.id AND c.membership_epoch = m.epoch AND c.capability = 'administrator' AND c.state = 'active'
    WHERE j.id = t.journey_id AND j.policy_generation > t.journey_policy_generation
  )) THEN RAISE EXCEPTION 'Accepted transfer must atomically move administration and advance generation.' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER transfer_acceptance AFTER INSERT OR UPDATE ON journeys.administration_transfer DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION journeys.enforce_transfer_acceptance();

CREATE FUNCTION sources.check_identity_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.owner_account_id <> OLD.owner_account_id OR NEW.created_at <> OLD.created_at OR NEW.revision <> OLD.revision + 1
      OR (OLD.state = 'deleted' AND NEW.state <> 'deleted') OR (OLD.state = 'deleting' AND NEW.state NOT IN ('deleting', 'deleted'))
      OR (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at) THEN
    RAISE EXCEPTION 'Source identity/revision cannot be rebound or revived.' USING ERRCODE = '23514';
  END IF;
  IF TG_TABLE_NAME = 'source' THEN
    IF NEW.kind <> OLD.kind OR NEW.provenance <> OLD.provenance THEN RAISE EXCEPTION 'Source provenance is immutable.' USING ERRCODE = '23514'; END IF;
  ELSE
    IF NEW.source_id <> OLD.source_id OR NEW.kind <> OLD.kind OR NEW.purpose <> OLD.purpose OR (OLD.state = 'verified' AND NEW.state = 'registered') THEN RAISE EXCEPTION 'Source asset identity is immutable.' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER source_identity_transition BEFORE UPDATE ON sources.source FOR EACH ROW EXECUTE FUNCTION sources.check_identity_transition();
CREATE TRIGGER asset_identity_transition BEFORE UPDATE ON sources.source_asset FOR EACH ROW EXECUTE FUNCTION sources.check_identity_transition();
CREATE FUNCTION sources.check_source_grant_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.id <> OLD.id OR NEW.source_id <> OLD.source_id OR NEW.owner_account_id <> OLD.owner_account_id OR NEW.journey_id <> OLD.journey_id OR NEW.created_at <> OLD.created_at
      OR NEW.revision <> OLD.revision + 1 OR NEW.changed_at < OLD.changed_at THEN
    RAISE EXCEPTION 'Source grant identity/revision is immutable or stale.' USING ERRCODE = '23514';
  END IF;
  IF NEW.state = 'active' AND (OLD.state <> 'active' OR (OLD.scope = 'journey_review' AND NEW.scope = 'publication_reuse')) AND NOT EXISTS (
      SELECT FROM journeys.journey AS j JOIN journeys.membership AS m ON m.journey_id = j.id AND m.account_id = NEW.owner_account_id AND m.state = 'active'
      JOIN identity.account AS a ON a.id = m.account_id AND a.state = 'active'
      WHERE j.id = NEW.journey_id AND j.lifecycle = 'active' AND j.administration = 'assigned') THEN
    RAISE EXCEPTION 'Grant expansion requires current open participation.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER source_grant_transition BEFORE UPDATE ON sources.source_grant FOR EACH ROW EXECUTE FUNCTION sources.check_source_grant_transition();
CREATE FUNCTION sources.check_initial_source_grant() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.state = 'active' AND NOT EXISTS (
    SELECT FROM journeys.journey AS j JOIN journeys.membership AS m ON m.journey_id = j.id AND m.account_id = NEW.owner_account_id AND m.state = 'active'
    JOIN identity.account AS a ON a.id = m.account_id AND a.state = 'active'
    WHERE j.id = NEW.journey_id AND j.lifecycle = 'active' AND j.administration = 'assigned') THEN
    RAISE EXCEPTION 'Initial contribution requires current open participation.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER source_grant_insert BEFORE INSERT ON sources.source_grant FOR EACH ROW EXECUTE FUNCTION sources.check_initial_source_grant();
CREATE FUNCTION sources.check_requested_asset() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'Requested asset snapshots are immutable.' USING ERRCODE = '23514'; END IF;
  IF NOT EXISTS (SELECT FROM sources.export_request AS r
    JOIN identity.account AS owner ON owner.id = r.owner_account_id AND owner.state = 'active'
    JOIN journeys.membership AS m ON m.id = r.requester_membership_id AND m.journey_id = r.journey_id AND m.account_id = r.requester_account_id AND m.epoch = r.requester_epoch AND m.state = 'active'
    JOIN identity.account AS actor ON actor.id = m.account_id AND actor.state = 'active'
    JOIN journeys.journey AS j ON j.id = r.journey_id AND j.lifecycle <> 'deleted' AND j.administration = 'assigned'
    JOIN sources.source_asset AS a ON a.id = NEW.asset_id AND a.source_id = NEW.source_id AND a.owner_account_id = r.owner_account_id AND a.state = 'verified' AND a.revision = NEW.asset_revision
    JOIN sources.source AS s ON s.id = a.source_id AND s.owner_account_id = owner.id AND s.state = 'active'
    JOIN sources.source_grant AS g ON g.id = NEW.source_grant_id AND g.source_id = s.id AND g.journey_id = j.id AND g.owner_account_id = owner.id AND g.state = 'active' AND g.revision = NEW.source_grant_revision
    WHERE r.id = NEW.request_id AND r.state = 'requested' AND r.expires_at > pg_catalog.clock_timestamp()) THEN
    RAISE EXCEPTION 'Requested asset is not a current eligible contributed original.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER request_asset_transition BEFORE INSERT OR UPDATE ON sources.export_request_asset FOR EACH ROW EXECUTE FUNCTION sources.check_requested_asset();
CREATE FUNCTION sources.check_export_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (pg_catalog.to_jsonb(NEW) - ARRAY['state', 'revision', 'closed_at']) IS DISTINCT FROM (pg_catalog.to_jsonb(OLD) - ARRAY['state', 'revision', 'closed_at'])
      OR NEW.revision <> OLD.revision + 1 OR (TG_TABLE_NAME = 'export_request' AND OLD.state <> 'requested' AND NEW.state <> OLD.state)
      OR (TG_TABLE_NAME = 'export_grant' AND OLD.state <> 'active' AND NEW.state <> OLD.state)
      OR (OLD.closed_at IS NOT NULL AND NEW.closed_at IS DISTINCT FROM OLD.closed_at) THEN
    RAISE EXCEPTION 'Export identity/snapshot cannot be rewritten or revived.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER export_request_transition BEFORE UPDATE ON sources.export_request FOR EACH ROW EXECUTE FUNCTION sources.check_export_transition();
CREATE TRIGGER export_grant_transition BEFORE UPDATE ON sources.export_grant FOR EACH ROW EXECUTE FUNCTION sources.check_export_transition();
CREATE FUNCTION sources.check_issued_asset() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN RAISE EXCEPTION 'Issued asset snapshots are immutable.' USING ERRCODE = '23514'; END IF;
  IF NOT EXISTS (SELECT FROM sources.export_grant AS eg
    JOIN sources.export_request AS r ON r.id = eg.request_id AND r.state = 'approved'
    JOIN identity.account AS owner ON owner.id = eg.owner_account_id AND owner.state = 'active'
    JOIN journeys.membership AS m ON m.id = eg.recipient_membership_id AND m.journey_id = eg.journey_id AND m.account_id = eg.recipient_account_id AND m.epoch = eg.recipient_epoch AND m.state = 'active'
    JOIN identity.account AS recipient ON recipient.id = m.account_id AND recipient.state = 'active'
    JOIN journeys.journey AS j ON j.id = eg.journey_id AND j.lifecycle <> 'deleted' AND j.administration = 'assigned'
    JOIN sources.source_asset AS a ON a.id = NEW.asset_id AND a.source_id = NEW.source_id AND a.owner_account_id = eg.owner_account_id AND a.state = 'verified' AND a.revision = NEW.asset_revision
    JOIN sources.source AS s ON s.id = a.source_id AND s.state = 'active'
    JOIN sources.source_grant AS sg ON sg.id = NEW.source_grant_id AND sg.source_id = s.id AND sg.journey_id = j.id AND sg.owner_account_id = owner.id AND sg.state = 'active' AND sg.revision = NEW.source_grant_revision
    WHERE eg.id = NEW.grant_id AND eg.state = 'active' AND eg.expires_at > pg_catalog.clock_timestamp()) THEN
    RAISE EXCEPTION 'Issued original approval is stale or ineligible.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER issued_asset_transition BEFORE INSERT OR UPDATE ON sources.export_grant_asset FOR EACH ROW EXECUTE FUNCTION sources.check_issued_asset();
CREATE FUNCTION sources.enforce_export_assets() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_id uuid; v_count integer;
BEGIN
  IF TG_TABLE_NAME IN ('export_request', 'export_request_asset') THEN
    IF TG_TABLE_NAME = 'export_request' THEN v_id := NEW.id; ELSE v_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.request_id ELSE NEW.request_id END; END IF;
    IF NOT EXISTS (SELECT FROM sources.export_request WHERE id = v_id) THEN RETURN NULL; END IF;
    SELECT count(*) INTO v_count FROM sources.export_request_asset WHERE request_id = v_id;
  ELSE
    IF TG_TABLE_NAME = 'export_grant' THEN v_id := NEW.id; ELSE v_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.grant_id ELSE NEW.grant_id END; END IF;
    IF NOT EXISTS (SELECT FROM sources.export_grant WHERE id = v_id) THEN RETURN NULL; END IF;
    SELECT count(*) INTO v_count FROM sources.export_grant_asset WHERE grant_id = v_id;
  END IF;
  IF v_count NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Export requires one to one hundred exact asset bindings.' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER request_exact_assets AFTER INSERT OR UPDATE ON sources.export_request DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION sources.enforce_export_assets();
CREATE CONSTRAINT TRIGGER request_asset_count AFTER INSERT OR DELETE ON sources.export_request_asset DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION sources.enforce_export_assets();
CREATE CONSTRAINT TRIGGER grant_exact_assets AFTER INSERT OR UPDATE ON sources.export_grant DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION sources.enforce_export_assets();
CREATE CONSTRAINT TRIGGER grant_asset_count AFTER INSERT OR DELETE ON sources.export_grant_asset DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION sources.enforce_export_assets();

CREATE FUNCTION operations.check_command_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF ROW(NEW.actor_account_id, NEW.command_id, NEW.operation_type, NEW.payload_digest, NEW.created_at, NEW.expires_at)
      IS DISTINCT FROM ROW(OLD.actor_account_id, OLD.command_id, OLD.operation_type, OLD.payload_digest, OLD.created_at, OLD.expires_at)
      OR (NEW.result_state <> OLD.result_state AND NOT (OLD.result_state = 'restriction_pending' AND NEW.result_state = 'restriction_complete'))
      OR (OLD.retention_state = 'redacted' AND NEW IS DISTINCT FROM OLD)
      OR (NEW.retention_state = 'redacted' AND OLD.retention_state = 'live' AND OLD.expires_at > pg_catalog.clock_timestamp())
      OR (NEW.retention_state = 'live' AND ROW(NEW.resource_kind, NEW.resource_id, NEW.resource_revision) IS DISTINCT FROM ROW(OLD.resource_kind, OLD.resource_id, OLD.resource_revision)) THEN
    RAISE EXCEPTION 'Command identity/digest/result barrier cannot be replaced.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER command_transition BEFORE UPDATE ON operations.command_receipt FOR EACH ROW EXECUTE FUNCTION operations.check_command_transition();
CREATE FUNCTION operations.reject_rewrite() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN RAISE EXCEPTION 'Event or issued snapshot is immutable.' USING ERRCODE = '23514'; END $$;
CREATE TRIGGER audit_immutable BEFORE UPDATE ON operations.audit_event FOR EACH ROW EXECUTE FUNCTION operations.reject_rewrite();
CREATE TRIGGER change_immutable BEFORE UPDATE ON operations.domain_change FOR EACH ROW EXECUTE FUNCTION operations.reject_rewrite();
CREATE TRIGGER restriction_immutable BEFORE UPDATE ON operations.restriction_event FOR EACH ROW EXECUTE FUNCTION operations.reject_rewrite();
CREATE TRIGGER receipt_immutable BEFORE UPDATE ON operations.restriction_receipt FOR EACH ROW EXECUTE FUNCTION operations.reject_rewrite();
CREATE FUNCTION operations.check_impact_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (pg_catalog.to_jsonb(NEW) - ARRAY['consumed_command_id', 'consumed_at']) IS DISTINCT FROM (pg_catalog.to_jsonb(OLD) - ARRAY['consumed_command_id', 'consumed_at'])
      OR (OLD.consumed_command_id IS NOT NULL AND NEW IS DISTINCT FROM OLD)
      OR (NEW.consumed_command_id IS NOT NULL AND NEW.expires_at <= pg_catalog.clock_timestamp()) THEN
    RAISE EXCEPTION 'Impact binding cannot be changed or reused.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER impact_transition BEFORE UPDATE ON operations.impact_preview FOR EACH ROW EXECUTE FUNCTION operations.check_impact_transition();
CREATE FUNCTION operations.check_lifecycle_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (pg_catalog.to_jsonb(NEW) - ARRAY['state', 'recovery_state', 'processed_units', 'total_units', 'next_unit_id', 'revision', 'error_code', 'updated_at', 'terminal_at', 'terminal_available_until']) IS DISTINCT FROM (pg_catalog.to_jsonb(OLD) - ARRAY['state', 'recovery_state', 'processed_units', 'total_units', 'next_unit_id', 'revision', 'error_code', 'updated_at', 'terminal_at', 'terminal_available_until'])
      OR NEW.revision <> OLD.revision + 1 OR NEW.processed_units < OLD.processed_units OR NEW.updated_at < OLD.updated_at
      OR (OLD.recovery_state = 'confirmed' AND NEW.recovery_state <> 'confirmed') OR (OLD.state = 'complete' AND (pg_catalog.to_jsonb(NEW) - ARRAY['revision', 'updated_at', 'recovery_state']) IS DISTINCT FROM (pg_catalog.to_jsonb(OLD) - ARRAY['revision', 'updated_at', 'recovery_state']))
      OR (OLD.terminal_at IS NOT NULL AND ROW(NEW.terminal_at, NEW.terminal_available_until) IS DISTINCT FROM ROW(OLD.terminal_at, OLD.terminal_available_until)) THEN
    RAISE EXCEPTION 'Lifecycle identity/progress/receipt cannot be reset.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER lifecycle_transition BEFORE UPDATE ON operations.lifecycle_operation FOR EACH ROW EXECUTE FUNCTION operations.check_lifecycle_transition();
CREATE FUNCTION operations.check_notice_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (pg_catalog.to_jsonb(NEW) - ARRAY['read_at', 'revision']) IS DISTINCT FROM (pg_catalog.to_jsonb(OLD) - ARRAY['read_at', 'revision'])
      OR NEW.revision <> OLD.revision + 1 OR (OLD.read_at IS NOT NULL AND NEW.read_at IS DISTINCT FROM OLD.read_at) THEN
    RAISE EXCEPTION 'Notice binding/read state cannot be reset.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER notice_transition BEFORE UPDATE ON operations.account_notice FOR EACH ROW EXECUTE FUNCTION operations.check_notice_transition();
CREATE FUNCTION operations.check_email_transition() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (pg_catalog.to_jsonb(NEW) - ARRAY['state', 'revision', 'attempts', 'key_id', 'ciphertext', 'nonce', 'authentication_tag', 'next_attempt_at', 'smtp_accepted_at', 'last_error_code'])
      IS DISTINCT FROM (pg_catalog.to_jsonb(OLD) - ARRAY['state', 'revision', 'attempts', 'key_id', 'ciphertext', 'nonce', 'authentication_tag', 'next_attempt_at', 'smtp_accepted_at', 'last_error_code'])
      OR NEW.revision <> OLD.revision + 1 OR NEW.attempts < OLD.attempts
      OR (OLD.state IN ('smtp_accepted', 'expired', 'cancelled') AND NEW.state <> OLD.state)
      OR (OLD.ciphertext IS NULL AND NEW.ciphertext IS NOT NULL)
      OR (NEW.ciphertext IS NOT NULL AND ROW(NEW.key_id, NEW.ciphertext, NEW.nonce, NEW.authentication_tag) IS DISTINCT FROM ROW(OLD.key_id, OLD.ciphertext, OLD.nonce, OLD.authentication_tag))
      OR (NEW.state = 'sending' AND NEW.expires_at <= pg_catalog.clock_timestamp()) THEN
    RAISE EXCEPTION 'Sealed mail binding/payload cannot be replaced or revived.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER email_transition BEFORE UPDATE ON operations.email_delivery FOR EACH ROW EXECUTE FUNCTION operations.check_email_transition();
CREATE FUNCTION operations.check_restriction_delivery() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.event_id <> OLD.event_id OR NEW.revision <> OLD.revision + 1 OR NEW.attempts < OLD.attempts
      OR (OLD.state = 'confirmed' AND NEW.state <> 'confirmed') THEN
    RAISE EXCEPTION 'Restriction delivery cannot be reset.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER restriction_delivery_transition BEFORE UPDATE ON operations.restriction_delivery FOR EACH ROW EXECUTE FUNCTION operations.check_restriction_delivery();
CREATE FUNCTION operations.enforce_receipt_integrity() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_event uuid;
BEGIN
  v_event := NEW.event_id;
  IF EXISTS (SELECT FROM operations.restriction_receipt AS r JOIN operations.restriction_event AS e ON e.id = r.event_id
      WHERE r.event_id = v_event AND (r.event_sha256 <> e.integrity_sha256 OR r.confirmed_at < e.created_at))
      OR EXISTS (SELECT FROM operations.restriction_delivery AS d WHERE d.event_id = v_event AND d.state = 'confirmed' AND NOT EXISTS (SELECT FROM operations.restriction_receipt AS r WHERE r.event_id = d.event_id)) THEN
    RAISE EXCEPTION 'Restriction confirmation requires the matching immutable receipt.' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER receipt_integrity AFTER INSERT ON operations.restriction_receipt DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION operations.enforce_receipt_integrity();
CREATE CONSTRAINT TRIGGER delivery_receipt_integrity AFTER INSERT OR UPDATE ON operations.restriction_delivery DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION operations.enforce_receipt_integrity();
-- Existing identity/journey default privileges and the earlier source/operation
-- defaults already revoke PUBLIC EXECUTE. Also revoke every new invoker helper explicitly.
DO $$ DECLARE v record; BEGIN
  FOR v IN SELECT p.oid::regprocedure AS signature FROM pg_catalog.pg_proc AS p
    JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('identity', 'journeys', 'sources', 'operations') AND p.prorettype = 'trigger'::regtype AND pg_catalog.pg_get_userbyid(p.proowner) = 'kairn_migrator' LOOP
    EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', v.signature);
  END LOOP;
END $$;

CREATE FUNCTION operations.enforce_operation_confirmation() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'lifecycle_operation' THEN v_id := NEW.id;
  ELSE SELECT operation_id INTO v_id FROM operations.restriction_event WHERE id = NEW.event_id; END IF;
  IF EXISTS (SELECT FROM operations.lifecycle_operation AS o WHERE o.id = v_id AND o.recovery_state = 'confirmed' AND (
    NOT EXISTS (SELECT FROM operations.restriction_event AS e WHERE e.operation_id = o.id)
    OR EXISTS (SELECT FROM operations.restriction_event AS e WHERE e.operation_id = o.id AND NOT EXISTS (SELECT FROM operations.restriction_receipt AS r WHERE r.event_id = e.id))
  )) THEN RAISE EXCEPTION 'Recovery confirmation requires every matching restriction receipt.' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER operation_confirmation AFTER INSERT OR UPDATE ON operations.lifecycle_operation DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION operations.enforce_operation_confirmation();
CREATE CONSTRAINT TRIGGER receipt_operation_confirmation AFTER INSERT ON operations.restriction_receipt DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION operations.enforce_operation_confirmation();
REVOKE ALL ON FUNCTION operations.enforce_operation_confirmation() FROM PUBLIC;

-- Verified dimensions belong to the immutable uploaded bytes. Decoding and
-- bounded re-encoding remain B03 worker work; a declared image is not proof.
CREATE FUNCTION identity.check_verified_avatar_input() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF OLD.verified_input_width IS NOT NULL AND ROW(NEW.verified_input_width, NEW.verified_input_height) IS DISTINCT FROM ROW(OLD.verified_input_width, OLD.verified_input_height) THEN
    RAISE EXCEPTION 'Verified avatar input dimensions are immutable.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION identity.check_verified_avatar_input() FROM PUBLIC;
CREATE TRIGGER avatar_verified_input BEFORE UPDATE ON identity.profile_avatar FOR EACH ROW EXECUTE FUNCTION identity.check_verified_avatar_input();

-- Operation targets cover every restrictive domain action. Targets are immutable
-- opaque references after creation, allowing policy-eligible media metadata purge.
CREATE FUNCTION operations.check_operation_target() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_valid boolean;
BEGIN
  CASE NEW.resource_kind
    WHEN 'account' THEN SELECT EXISTS (SELECT FROM identity.account WHERE id = NEW.resource_id) INTO v_valid;
    WHEN 'journey' THEN SELECT EXISTS (SELECT FROM journeys.journey WHERE id = NEW.resource_id) INTO v_valid;
    WHEN 'membership' THEN SELECT EXISTS (SELECT FROM journeys.membership WHERE id = NEW.resource_id AND journey_id = NEW.journey_id) INTO v_valid;
    WHEN 'invitation' THEN SELECT EXISTS (SELECT FROM journeys.invitation WHERE id = NEW.resource_id AND journey_id = NEW.journey_id) INTO v_valid;
    WHEN 'transfer' THEN SELECT EXISTS (SELECT FROM journeys.administration_transfer WHERE id = NEW.resource_id AND journey_id = NEW.journey_id AND (NEW.target_membership_id IS NULL OR target_membership_id = NEW.target_membership_id)) INTO v_valid;
    WHEN 'source' THEN SELECT EXISTS (SELECT FROM sources.source WHERE id = NEW.resource_id AND owner_account_id = NEW.actor_account_id) INTO v_valid;
    WHEN 'source_grant' THEN SELECT EXISTS (SELECT FROM sources.source_grant WHERE id = NEW.resource_id AND journey_id = NEW.journey_id AND owner_account_id = NEW.actor_account_id) INTO v_valid;
    WHEN 'export_grant' THEN SELECT EXISTS (SELECT FROM sources.export_grant WHERE id = NEW.resource_id AND journey_id = NEW.journey_id AND owner_account_id = NEW.actor_account_id) INTO v_valid;
    WHEN 'avatar' THEN SELECT EXISTS (SELECT FROM identity.profile_avatar WHERE id = NEW.resource_id AND owner_account_id = NEW.actor_account_id) INTO v_valid;
    ELSE v_valid := false;
  END CASE;
  IF NOT v_valid THEN RAISE EXCEPTION 'Operation target binding is unavailable.' USING ERRCODE = '23503'; END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION operations.check_operation_target() FROM PUBLIC;
CREATE TRIGGER operation_target BEFORE INSERT ON operations.lifecycle_operation FOR EACH ROW EXECUTE FUNCTION operations.check_operation_target();
