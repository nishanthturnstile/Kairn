-- S02 journey/membership foundation. Runtime writes stay closed until the B03
-- command, policy, receipt, audit and restriction boundary is installed.
REVOKE ALL ON SCHEMA journeys FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA journeys FROM PUBLIC;
GRANT USAGE ON SCHEMA journeys TO kairn_server, kairn_journey_policy;
GRANT USAGE ON SCHEMA identity TO kairn_journey_policy;
GRANT SELECT ON ALL TABLES IN SCHEMA journeys TO kairn_server;
-- The non-login lookup owner sees only identifiers and current policy inputs.
GRANT SELECT (id, state) ON identity.account TO kairn_journey_policy;
GRANT SELECT (id, lifecycle, administration), UPDATE (id) ON journeys.journey TO kairn_journey_policy;
GRANT SELECT (id, journey_id, account_id, state, epoch) ON journeys.membership TO kairn_journey_policy;
GRANT SELECT (id, membership_id, journey_id, membership_epoch, capability, state) ON journeys.member_capability TO kairn_journey_policy;
ALTER TABLE journeys.journey FORCE ROW LEVEL SECURITY;
ALTER TABLE journeys.membership FORCE ROW LEVEL SECURITY;
ALTER TABLE journeys.member_capability FORCE ROW LEVEL SECURITY;
CREATE POLICY journey_migration ON journeys.journey TO kairn_migrator USING (true) WITH CHECK (true);
CREATE POLICY membership_migration ON journeys.membership TO kairn_migrator USING (true) WITH CHECK (true);
CREATE POLICY capability_migration ON journeys.member_capability TO kairn_migrator USING (true) WITH CHECK (true);
-- Helper policies are acyclic and column-bounded; runtime logins cannot assume this role.
CREATE POLICY account_journey_lookup ON identity.account FOR SELECT TO kairn_journey_policy USING (true);
CREATE POLICY journey_lookup ON journeys.journey FOR SELECT TO kairn_journey_policy USING (true);
CREATE POLICY journey_guard_lock ON journeys.journey FOR UPDATE TO kairn_journey_policy USING (true) WITH CHECK (false);
CREATE POLICY membership_lookup ON journeys.membership FOR SELECT TO kairn_journey_policy USING (true);
CREATE POLICY capability_lookup ON journeys.member_capability FOR SELECT TO kairn_journey_policy USING (true);

CREATE FUNCTION journeys.actor_can_read_journey(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (
    SELECT FROM journeys.journey AS j
    JOIN journeys.membership AS m ON m.journey_id = j.id AND m.state = 'active'
    JOIN identity.account AS a ON a.id = m.account_id AND a.state = 'active'
    WHERE j.id = p_id AND j.lifecycle <> 'deleted'
      AND a.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid
  );
$$;
CREATE FUNCTION journeys.actor_can_read_membership(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (
    SELECT FROM journeys.membership AS target
    JOIN identity.account AS actor ON actor.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid AND actor.state = 'active'
    WHERE target.id = p_id AND (target.account_id = actor.id OR EXISTS (
      SELECT FROM journeys.journey AS j
      JOIN journeys.membership AS mine ON mine.journey_id = j.id AND mine.account_id = actor.id AND mine.state = 'active'
      JOIN identity.account AS recipient ON recipient.id = target.account_id AND recipient.state = 'active'
      WHERE j.id = target.journey_id AND j.lifecycle <> 'deleted' AND target.state = 'active'
        AND EXISTS (SELECT FROM journeys.member_capability AS c
          WHERE c.journey_id = j.id AND c.capability = 'administrator' AND c.state = 'active'
            AND ((c.membership_id = mine.id AND c.membership_epoch = mine.epoch)
              OR (c.membership_id = target.id AND c.membership_epoch = target.epoch)))
    ))
  );
$$;
CREATE FUNCTION journeys.actor_can_read_capability(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
  SELECT EXISTS (
    SELECT FROM journeys.member_capability AS c
    JOIN journeys.membership AS m ON m.id = c.membership_id
    JOIN identity.account AS actor ON actor.id = nullif(pg_catalog.current_setting('kairn.account_id', true), '')::uuid AND actor.state = 'active'
    WHERE c.id = p_id AND (m.account_id = actor.id OR (
      m.state = 'active' AND c.state = 'active' AND c.membership_epoch = m.epoch
      AND journeys.actor_can_read_membership(m.id)))
  );
$$;
REVOKE ALL ON FUNCTION journeys.actor_can_read_journey(uuid), journeys.actor_can_read_membership(uuid), journeys.actor_can_read_capability(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION journeys.actor_can_read_journey(uuid), journeys.actor_can_read_membership(uuid), journeys.actor_can_read_capability(uuid) TO kairn_server;
CREATE POLICY journey_current_read ON journeys.journey FOR SELECT TO kairn_server USING (journeys.actor_can_read_journey(id));
CREATE POLICY membership_scoped_read ON journeys.membership FOR SELECT TO kairn_server USING (journeys.actor_can_read_membership(id));
CREATE POLICY capability_scoped_read ON journeys.member_capability FOR SELECT TO kairn_server USING (journeys.actor_can_read_capability(id));

CREATE FUNCTION journeys.check_journey_write() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id <> OLD.id OR NEW.creator_account_id <> OLD.creator_account_id OR NEW.created_at <> OLD.created_at
        OR NEW.revision <> OLD.revision + 1 OR NEW.policy_generation < OLD.policy_generation THEN
      RAISE EXCEPTION 'Journey identity/revision is immutable or stale.' USING ERRCODE = '23514';
    END IF;
    IF (OLD.lifecycle = 'deleted' AND NEW.lifecycle <> 'deleted')
        OR (OLD.lifecycle = 'archived' AND NEW.lifecycle = 'active')
        OR (OLD.administration = 'frozen' AND NEW.administration <> 'frozen')
        OR ((NEW.lifecycle <> OLD.lifecycle OR NEW.administration <> OLD.administration) AND NEW.policy_generation <= OLD.policy_generation)
        OR (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS DISTINCT FROM OLD.deleted_at) THEN
      RAISE EXCEPTION 'Journey restriction cannot be reversed by ordinary writes.' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW.time_zone IS NOT NULL AND NOT EXISTS (SELECT FROM pg_catalog.pg_timezone_names WHERE name = NEW.time_zone) THEN
    RAISE EXCEPTION 'Unknown journey time zone.' USING ERRCODE = '23514';
  END IF;
  IF NEW.start_at IS NOT NULL AND (NEW.time_zone IS NULL
      OR pg_catalog.to_char(NEW.start_at AT TIME ZONE NEW.time_zone, 'YYYY-MM-DD"T"HH24:MI') IS DISTINCT FROM NEW.start_local
      OR extract(epoch FROM ((NEW.start_at AT TIME ZONE NEW.time_zone) - (NEW.start_at AT TIME ZONE 'UTC'))) / 60 IS DISTINCT FROM NEW.start_offset_minutes::numeric) THEN
    RAISE EXCEPTION 'Journey start local time, instant and offset disagree.' USING ERRCODE = '23514';
  END IF;
  IF NEW.end_at IS NOT NULL AND (NEW.time_zone IS NULL
      OR pg_catalog.to_char(NEW.end_at AT TIME ZONE NEW.time_zone, 'YYYY-MM-DD"T"HH24:MI') IS DISTINCT FROM NEW.end_local
      OR extract(epoch FROM ((NEW.end_at AT TIME ZONE NEW.time_zone) - (NEW.end_at AT TIME ZONE 'UTC'))) / 60 IS DISTINCT FROM NEW.end_offset_minutes::numeric) THEN
    RAISE EXCEPTION 'Journey end local time, instant and offset disagree.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER journey_write BEFORE INSERT OR UPDATE ON journeys.journey FOR EACH ROW EXECUTE FUNCTION journeys.check_journey_write();

CREATE FUNCTION journeys.check_membership_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'active' OR NEW.epoch <> 1 OR NEW.revision <> 1
        OR NEW.previous_administrator OR NEW.previous_coauthor OR NEW.previous_publisher THEN
      RAISE EXCEPTION 'Membership must begin in a new active epoch.' USING ERRCODE = '23514';
    END IF;
  ELSE
    IF NEW.id <> OLD.id OR NEW.journey_id <> OLD.journey_id OR NEW.account_id <> OLD.account_id
        OR NEW.created_at <> OLD.created_at OR NEW.revision <> OLD.revision + 1 THEN
      RAISE EXCEPTION 'Membership identity/revision is immutable or stale.' USING ERRCODE = '23514';
    END IF;
    IF OLD.state = 'active' AND NEW.state <> 'active' THEN
      IF NEW.epoch <> OLD.epoch OR NEW.joined_at <> OLD.joined_at THEN
        RAISE EXCEPTION 'Ending membership cannot replace its epoch.' USING ERRCODE = '23514';
      END IF;
      -- Coordinators end membership before revoking its current capability rows.
      SELECT coalesce(bool_or(capability = 'administrator'), false), coalesce(bool_or(capability = 'coauthor'), false), coalesce(bool_or(capability = 'publisher'), false)
        INTO NEW.previous_administrator, NEW.previous_coauthor, NEW.previous_publisher
        FROM journeys.member_capability WHERE membership_id = OLD.id AND membership_epoch = OLD.epoch AND state = 'active';
    ELSIF OLD.state <> 'active' AND NEW.state = 'active' THEN
      IF NEW.epoch <> OLD.epoch + 1 OR NEW.joined_at < OLD.ended_at THEN
        RAISE EXCEPTION 'Rejoin requires the next membership epoch.' USING ERRCODE = '23514';
      END IF;
      NEW.previous_administrator := false; NEW.previous_coauthor := false; NEW.previous_publisher := false;
    ELSIF NEW.epoch <> OLD.epoch OR NEW.joined_at <> OLD.joined_at OR NEW.state <> OLD.state
        OR NEW.ended_at IS DISTINCT FROM OLD.ended_at OR NEW.end_reason IS DISTINCT FROM OLD.end_reason
        OR NEW.previous_administrator <> OLD.previous_administrator OR NEW.previous_coauthor <> OLD.previous_coauthor OR NEW.previous_publisher <> OLD.previous_publisher THEN
      RAISE EXCEPTION 'Membership history cannot be rewritten.' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER membership_transition BEFORE INSERT OR UPDATE ON journeys.membership FOR EACH ROW EXECUTE FUNCTION journeys.check_membership_transition();

CREATE FUNCTION journeys.check_capability_transition() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'active' OR NEW.revision <> 1 THEN
      RAISE EXCEPTION 'Capability must begin active.' USING ERRCODE = '23514';
    END IF;
  ELSE
    IF NEW.id <> OLD.id OR NEW.membership_id <> OLD.membership_id OR NEW.journey_id <> OLD.journey_id
        OR NEW.membership_epoch <> OLD.membership_epoch OR NEW.capability <> OLD.capability OR NEW.revision <> OLD.revision + 1 THEN
      RAISE EXCEPTION 'Capability identity/revision is immutable or stale.' USING ERRCODE = '23514';
    END IF;
    IF OLD.state = 'revoked' AND NEW.state = 'active' THEN
      IF NEW.assigned_at < OLD.revoked_at THEN
        RAISE EXCEPTION 'New capability assignment predates revocation.' USING ERRCODE = '23514';
      END IF;
    ELSIF NEW.assigned_by <> OLD.assigned_by OR NEW.assigned_at <> OLD.assigned_at
        OR (OLD.state = 'revoked' AND (NEW.revoked_by IS DISTINCT FROM OLD.revoked_by OR NEW.revoked_at IS DISTINCT FROM OLD.revoked_at)) THEN
      RAISE EXCEPTION 'Capability assignment history cannot be rewritten.' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER capability_transition BEFORE INSERT OR UPDATE ON journeys.member_capability FOR EACH ROW EXECUTE FUNCTION journeys.check_capability_transition();

CREATE FUNCTION journeys.enforce_graph() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET row_security = on AS $$
DECLARE v_id uuid; v_lifecycle text; v_administration text; v_admins integer;
BEGIN
  IF TG_TABLE_NAME = 'journey' THEN
    v_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  ELSE
    v_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.journey_id ELSE NEW.journey_id END;
  END IF;
  -- Serialize final checks per canonical journey. B03 coordinators must lock this
  -- row first, before membership/capability rows, to avoid lock-order inversions.
  SELECT lifecycle, administration INTO v_lifecycle, v_administration FROM journeys.journey WHERE id = v_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF EXISTS (SELECT FROM journeys.member_capability AS c
      JOIN journeys.membership AS m ON m.id = c.membership_id
      WHERE c.journey_id = v_id AND (c.membership_epoch > m.epoch OR (c.state = 'active' AND (m.state <> 'active' OR c.membership_epoch <> m.epoch)))) THEN
    RAISE EXCEPTION 'Capability does not belong to a current membership epoch.' USING ERRCODE = '23514';
  END IF;
  SELECT count(*) INTO v_admins FROM journeys.member_capability WHERE journey_id = v_id AND capability = 'administrator' AND state = 'active';
  IF v_lifecycle <> 'deleted' AND v_administration <> 'frozen' AND v_admins <> 1 THEN
    RAISE EXCEPTION 'Journey requires one administrator or an explicit freeze.' USING ERRCODE = '23514';
  END IF;
  IF v_lifecycle = 'deleted' AND (v_admins <> 0 OR EXISTS (SELECT FROM journeys.membership WHERE journey_id = v_id AND state = 'active')) THEN
    RAISE EXCEPTION 'Deleted journey cannot retain active participation.' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER journey_graph AFTER INSERT OR UPDATE OR DELETE ON journeys.journey DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION journeys.enforce_graph();
CREATE CONSTRAINT TRIGGER membership_graph AFTER INSERT OR UPDATE OR DELETE ON journeys.membership DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION journeys.enforce_graph();
CREATE CONSTRAINT TRIGGER capability_graph AFTER INSERT OR UPDATE OR DELETE ON journeys.member_capability DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION journeys.enforce_graph();

REVOKE ALL ON FUNCTION journeys.check_journey_write(), journeys.check_membership_transition(), journeys.check_capability_transition(), journeys.enforce_graph() FROM PUBLIC;
GRANT CREATE ON SCHEMA journeys TO kairn_journey_policy;
ALTER FUNCTION journeys.actor_can_read_journey(uuid) OWNER TO kairn_journey_policy;
ALTER FUNCTION journeys.actor_can_read_membership(uuid) OWNER TO kairn_journey_policy;
ALTER FUNCTION journeys.actor_can_read_capability(uuid) OWNER TO kairn_journey_policy;
ALTER FUNCTION journeys.check_membership_transition() OWNER TO kairn_journey_policy;
ALTER FUNCTION journeys.enforce_graph() OWNER TO kairn_journey_policy;
REVOKE CREATE ON SCHEMA journeys FROM kairn_journey_policy;
ALTER DEFAULT PRIVILEGES IN SCHEMA journeys REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
