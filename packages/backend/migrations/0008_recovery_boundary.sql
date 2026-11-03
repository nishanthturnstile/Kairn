ALTER TABLE "identity"."profile_avatar" ADD COLUMN "uploaded_at" timestamp with time zone;
--> statement-breakpoint
-- Only the authenticated upload gateway records its verified immutable write.
-- Upload completion must remain retryable when the client completes too early.
CREATE FUNCTION operations.record_avatar_upload(e uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN
 IF operations.avatar_target(e,'upload') IS NULL THEN RAISE EXCEPTION 'Avatar unavailable' USING ERRCODE='42501'; END IF;
 UPDATE identity.profile_avatar SET uploaded_at=greatest(pg_catalog.clock_timestamp(),created_at),revision=revision+1 WHERE id=e AND uploaded_at IS NULL;
END $$;
REVOKE ALL ON FUNCTION operations.record_avatar_upload(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION operations.record_avatar_upload(uuid) TO kairn_server;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.record_avatar_upload(uuid) OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
CREATE TABLE "identity"."retired_avatar" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_account_id" uuid NOT NULL,
	"retired_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity"."retired_avatar" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "identity"."retired_avatar" ADD CONSTRAINT "retired_avatar_owner_account_id_account_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "identity"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "retired_avatar_owner_idx" ON "identity"."retired_avatar" USING btree ("owner_account_id");
ALTER TABLE "identity"."profile_avatar" ADD COLUMN "quarantine_purged_at" timestamp with time zone;
CREATE TABLE "operations"."recovery_barrier" (
	"resource_kind" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"generation" bigint NOT NULL,
	"sequence" bigint NOT NULL,
	"checkpoint_sha256" text NOT NULL,
	CONSTRAINT "recovery_barrier_resource_kind_resource_id_pk" PRIMARY KEY("resource_kind","resource_id"),
	CONSTRAINT "recovery_barrier_kind" CHECK ("operations"."recovery_barrier"."resource_kind" IN ('account', 'journey', 'membership', 'invitation', 'transfer', 'source', 'source_grant', 'export_grant', 'avatar')),
	CONSTRAINT "recovery_barrier_versions" CHECK ("operations"."recovery_barrier"."generation" BETWEEN 1 AND 9007199254740991 AND "operations"."recovery_barrier"."sequence" BETWEEN 1 AND 9007199254740991),
	CONSTRAINT "recovery_barrier_hash" CHECK ("operations"."recovery_barrier"."checkpoint_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "operations"."recovery_barrier" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "operations"."recovery_checkpoint" (
	"id" integer PRIMARY KEY NOT NULL,
	"sequence" bigint NOT NULL,
	"checkpoint_sha256" text NOT NULL,
	CONSTRAINT "recovery_checkpoint_singleton" CHECK ("operations"."recovery_checkpoint"."id"=1 AND "operations"."recovery_checkpoint"."sequence">=0),
	CONSTRAINT "recovery_checkpoint_hash" CHECK ("operations"."recovery_checkpoint"."checkpoint_sha256" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "operations"."recovery_checkpoint" ENABLE ROW LEVEL SECURITY;ALTER TABLE operations.recovery_barrier FORCE ROW LEVEL SECURITY;
ALTER TABLE operations.recovery_checkpoint FORCE ROW LEVEL SECURITY;
REVOKE ALL ON operations.recovery_barrier,operations.recovery_checkpoint FROM PUBLIC,kairn_server,kairn_auth,kairn_worker;
CREATE POLICY recovery_operator ON operations.recovery_barrier TO kairn_migrator USING(true) WITH CHECK(true);
CREATE POLICY recovery_operator ON operations.recovery_checkpoint TO kairn_migrator USING(true) WITH CHECK(true);
GRANT SELECT ON operations.recovery_barrier TO kairn_command;
CREATE POLICY recovery_command_read ON operations.recovery_barrier FOR SELECT TO kairn_command USING(true);
INSERT INTO operations.recovery_checkpoint VALUES(1,0,repeat('0',64));
CREATE FUNCTION operations.replay_restriction(p jsonb,seq bigint,hash text) RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE rk text:=p->>'resourceKind'; rid uuid:=(p->>'resourceId')::uuid; j uuid:=(p->>'journeyId')::uuid; mid uuid:=(p->>'membershipId')::uuid; now_at timestamptz:=pg_catalog.clock_timestamp(); current_seq bigint;
BEGIN
 SELECT sequence INTO current_seq FROM operations.recovery_checkpoint WHERE id=1 FOR UPDATE;
 IF seq<=current_seq THEN RETURN; END IF;
 IF seq<>current_seq+1 THEN RAISE EXCEPTION 'Missing ordered journal tail' USING ERRCODE='23514'; END IF;
 INSERT INTO operations.recovery_barrier(resource_kind,resource_id,generation,sequence,checkpoint_sha256) VALUES(rk,rid,(p->>'generation')::bigint,seq,hash)
 ON CONFLICT(resource_kind,resource_id) DO UPDATE SET generation=greatest(recovery_barrier.generation,excluded.generation),sequence=excluded.sequence,checkpoint_sha256=excluded.checkpoint_sha256;
 IF j IS NOT NULL THEN PERFORM 1 FROM journeys.journey WHERE id=j FOR UPDATE; END IF;
 CASE rk
 WHEN 'account' THEN
   UPDATE identity.account SET state='deleting',deleted_at=now_at,revision=revision+1,policy_generation=greatest(policy_generation+1,(p->>'generation')::bigint) WHERE id=rid AND state='active';
   INSERT INTO identity.retired_auth_subject(auth_subject_id,account_id,deny_generation) SELECT auth_subject_id,id,policy_generation FROM identity.account WHERE id=rid AND auth_subject_id IS NOT NULL ON CONFLICT DO NOTHING;
 WHEN 'journey' THEN
   IF p->>'kind'='journey.delete' THEN
     UPDATE journeys.membership SET state='removed',ended_at=now_at,end_reason='journey_deleted',revision=revision+1 WHERE journey_id=rid AND state='active';
     UPDATE journeys.member_capability SET state='revoked',revoked_at=now_at,revoked_by=assigned_by,revision=revision+1 WHERE journey_id=rid AND state='active';
   END IF;
   UPDATE journeys.journey SET lifecycle=CASE WHEN p->>'kind'='journey.delete' THEN 'deleted' WHEN p->>'kind'='journey.archive' AND lifecycle='active' THEN 'archived' ELSE lifecycle END,deleted_at=CASE WHEN p->>'kind'='journey.delete' THEN now_at ELSE deleted_at END,administration=CASE WHEN p->>'kind'='journey.freeze' THEN 'frozen' ELSE administration END,revision=revision+1,policy_generation=greatest(policy_generation+1,(p->>'generation')::bigint) WHERE id=rid AND lifecycle<>'deleted';
 WHEN 'membership' THEN
   UPDATE journeys.membership SET state=CASE WHEN p->>'kind'='membership.leave' THEN 'left' ELSE 'removed' END,ended_at=now_at,end_reason=CASE WHEN p->>'kind'='membership.leave' THEN 'left' ELSE 'removed' END,revision=revision+1 WHERE id=rid AND state='active';
   UPDATE journeys.member_capability SET state='revoked',revoked_at=now_at,revoked_by=assigned_by,revision=revision+1 WHERE membership_id=rid AND state='active';
   UPDATE journeys.journey SET administration=CASE WHEN NOT EXISTS(SELECT FROM journeys.member_capability WHERE journey_id=j AND capability='administrator' AND state='active') THEN 'frozen' ELSE administration END,revision=revision+1,policy_generation=greatest(policy_generation+1,(p->>'generation')::bigint) WHERE id=j;
 WHEN 'invitation' THEN UPDATE journeys.invitation SET state='revoked',closed_at=now_at,revision=revision+1 WHERE id=rid AND state='pending';
 WHEN 'transfer' THEN
   UPDATE journeys.administration_transfer SET state='invalidated',closed_at=now_at,revision=revision+1 WHERE id=rid AND state='offered';
   IF p->>'kind'='transfer.accept' THEN UPDATE journeys.journey SET administration='frozen',revision=revision+1,policy_generation=policy_generation+1 WHERE id=j AND lifecycle<>'deleted'; END IF;
 WHEN 'source_grant' THEN UPDATE sources.source_grant SET state='withdrawn',scope='only_me',changed_by=NULL,changed_at=now_at,revision=revision+1 WHERE id=rid AND state='active';
 WHEN 'source' THEN UPDATE sources.source SET state='deleting',deleted_at=now_at,revision=revision+1 WHERE id=rid AND state='active';
 WHEN 'export_grant' THEN UPDATE sources.export_grant SET state='invalidated',closed_at=now_at,revision=revision+1 WHERE id=rid AND state='active';
 WHEN 'avatar' THEN
   UPDATE identity.profile SET avatar_id=NULL,revision=revision+1 WHERE avatar_id=rid;
   UPDATE identity.profile_avatar SET state='deleting',revision=revision+1 WHERE id=rid AND state NOT IN ('deleting','deleted');
 ELSE RAISE EXCEPTION 'Unknown restriction resource' USING ERRCODE='22023'; END CASE;
 UPDATE operations.recovery_checkpoint SET sequence=seq,checkpoint_sha256=hash WHERE id=1;
END $$;
REVOKE ALL ON FUNCTION operations.replay_restriction(jsonb,bigint,text) FROM PUBLIC;
ALTER TABLE kairn_migrations.identity_release ADD COLUMN boundary_sha256 text;
-- Reusing an opaque source UUID that a restored checkpoint lacks cannot bypass a deny.
CREATE FUNCTION operations.check_recovered_source() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN IF EXISTS(SELECT FROM operations.recovery_barrier WHERE resource_kind='source' AND resource_id=NEW.id) THEN RAISE EXCEPTION 'Recovered identity is denied' USING ERRCODE='42501'; END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION operations.check_recovered_source() FROM PUBLIC;
CREATE TRIGGER source_recovery_barrier BEFORE INSERT ON sources.source FOR EACH ROW EXECUTE FUNCTION operations.check_recovered_source();
CREATE FUNCTION operations.restored_cleanup_targets() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
 SELECT coalesce(pg_catalog.jsonb_agg(id),'[]'::jsonb) FROM(SELECT a.id FROM operations.recovery_barrier b JOIN identity.account a ON a.id=b.resource_id WHERE b.resource_kind='account' AND a.state='deleting' ORDER BY a.id LIMIT 20) targets
$$;
GRANT EXECUTE ON FUNCTION operations.restored_cleanup_targets() TO kairn_worker;
REVOKE ALL ON FUNCTION operations.restored_cleanup_targets() FROM PUBLIC;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.restored_cleanup_targets() OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
CREATE FUNCTION operations.mark_avatar_quarantine_purged(e uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
 UPDATE identity.profile_avatar SET quarantine_purged_at=pg_catalog.clock_timestamp(),revision=revision+1 WHERE id=e AND state='available' AND quarantine_purged_at IS NULL
$$;
GRANT EXECUTE ON FUNCTION operations.mark_avatar_quarantine_purged(uuid) TO kairn_worker;
REVOKE ALL ON FUNCTION operations.mark_avatar_quarantine_purged(uuid) FROM PUBLIC;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.mark_avatar_quarantine_purged(uuid) OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
-- Generator-owned auth tables remain byte-for-byte generated. These operational
-- indexes serve the bounded expiry sweeps without changing that generator input.
CREATE INDEX auth_verification_expiry_idx ON authn.verification(expires_at,id);
CREATE INDEX auth_session_expiry_idx ON authn.session(expires_at,id);
CREATE INDEX avatar_raw_cleanup_idx ON identity.profile_avatar(id) WHERE state='available' AND quarantine_purged_at IS NULL;
GRANT SELECT(id,expires_at),DELETE ON authn.verification TO kairn_command;
GRANT SELECT(id,expires_at) ON authn.session TO kairn_command;
GRANT DELETE ON operations.abuse_counter,operations.impact_preview,operations.account_notice,operations.audit_event TO kairn_command;
CREATE FUNCTION operations.retention_unit() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN
 WITH batch AS(SELECT id FROM authn.rate_limit WHERE last_request < (extract(epoch FROM pg_catalog.clock_timestamp())*1000-172800000)::bigint ORDER BY last_request,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM authn.rate_limit r USING batch WHERE r.id=batch.id;
 WITH batch AS(SELECT operation,key_hash,window_started_at FROM operations.abuse_counter WHERE expires_at<=pg_catalog.clock_timestamp() ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM operations.abuse_counter c USING batch b WHERE c.operation=b.operation AND c.key_hash=b.key_hash AND c.window_started_at=b.window_started_at;
 WITH batch AS(SELECT id FROM authn.verification WHERE expires_at<=pg_catalog.clock_timestamp() ORDER BY expires_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM authn.verification v USING batch WHERE v.id=batch.id;
 WITH batch AS(SELECT id FROM authn.session WHERE expires_at<=pg_catalog.clock_timestamp() ORDER BY expires_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM authn.session s USING batch WHERE s.id=batch.id;
 WITH batch AS(SELECT id FROM operations.email_delivery WHERE created_at<=pg_catalog.clock_timestamp()-interval '30 days' AND ciphertext IS NULL AND state IN ('smtp_accepted','failed','expired','cancelled') ORDER BY created_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM operations.email_delivery m USING batch WHERE m.id=batch.id;
 WITH batch AS(SELECT id FROM operations.impact_preview WHERE expires_at<=pg_catalog.clock_timestamp() ORDER BY expires_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM operations.impact_preview p USING batch WHERE p.id=batch.id;
 WITH batch AS(SELECT actor_account_id,command_id FROM operations.command_receipt WHERE retention_state='live' AND result_state<>'restriction_pending' AND expires_at<=pg_catalog.clock_timestamp() ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED)
 UPDATE operations.command_receipt c SET retention_state='redacted',resource_kind=NULL,resource_id=NULL,resource_revision=NULL FROM batch b WHERE c.actor_account_id=b.actor_account_id AND c.command_id=b.command_id;
 WITH batch AS(SELECT id FROM operations.account_notice WHERE created_at<=pg_catalog.clock_timestamp()-interval '90 days' ORDER BY created_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM operations.account_notice n USING batch WHERE n.id=batch.id;
 WITH batch AS(SELECT id FROM operations.audit_event a WHERE occurred_at<=pg_catalog.clock_timestamp()-interval '365 days' AND NOT EXISTS(SELECT FROM operations.account_notice WHERE event_id=a.id) ORDER BY occurred_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 DELETE FROM operations.audit_event a USING batch WHERE a.id=batch.id;
 -- Absolute server-time expiry is the deny. These terminal markers do not substitute
 -- for journaling an early revocation and cannot make a still-valid offer disappear.
 WITH batch AS(SELECT id FROM journeys.invitation WHERE state='pending' AND expires_at<=pg_catalog.clock_timestamp() ORDER BY expires_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 UPDATE journeys.invitation i SET state='expired',closed_at=expires_at,revision=revision+1 FROM batch WHERE i.id=batch.id;
 WITH batch AS(SELECT id FROM journeys.administration_transfer WHERE state='offered' AND expires_at<=pg_catalog.clock_timestamp() ORDER BY expires_at,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 UPDATE journeys.administration_transfer t SET state='expired',closed_at=expires_at,revision=revision+1 FROM batch WHERE t.id=batch.id;
 WITH batch AS(SELECT id FROM journeys.recipient_guard g WHERE recipient_email IS NOT NULL AND NOT EXISTS(SELECT FROM journeys.invitation i WHERE i.guard_id=g.id AND (i.state='pending' OR i.closed_at>pg_catalog.clock_timestamp()-interval '30 days')) AND g.created_at<=pg_catalog.clock_timestamp()-interval '30 days' ORDER BY g.created_at,g.id LIMIT 100 FOR UPDATE SKIP LOCKED)
 UPDATE journeys.recipient_guard g SET recipient_email=NULL,revision=revision+1 FROM batch WHERE g.id=batch.id;
 -- Restriction/retirement/recovery records deliberately have no automatic GC:
 -- independent head plus retirement of every restorable backup is not supplied here.
END $$;
GRANT EXECUTE ON FUNCTION operations.retention_unit() TO kairn_worker;
REVOKE ALL ON FUNCTION operations.retention_unit() FROM PUBLIC;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.retention_unit() OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
CREATE INDEX audit_retention_idx ON operations.audit_event(occurred_at,id);
CREATE INDEX notice_retention_idx ON operations.account_notice(created_at,id);
CREATE INDEX mail_metadata_retention_idx ON operations.email_delivery(created_at,id) WHERE ciphertext IS NULL;
CREATE INDEX guard_retention_idx ON journeys.recipient_guard(created_at,id) WHERE recipient_email IS NOT NULL;

GRANT SELECT(id,last_request),DELETE ON authn.rate_limit TO kairn_command;
-- PostgreSQL requires UPDATE on at least one column for the retention row locks.
-- These helpers never change auth identifiers or expose auth token/credential columns.
GRANT UPDATE(id) ON authn.rate_limit,authn.verification,authn.session TO kairn_command;
CREATE INDEX auth_rate_limit_retention_idx ON authn.rate_limit(last_request,id);
CREATE FUNCTION operations.freeze_recovered_administration(a uuid) RETURNS integer LANGUAGE plpgsql SET search_path='' AS $$
DECLARE n integer;BEGIN
 WITH batch AS(SELECT j.id FROM journeys.journey j WHERE j.lifecycle<>'deleted' AND j.administration='assigned' AND EXISTS(SELECT FROM journeys.member_capability c JOIN journeys.membership m ON m.id=c.membership_id AND m.epoch=c.membership_epoch JOIN identity.account ac ON ac.id=m.account_id WHERE c.journey_id=j.id AND c.capability='administrator' AND c.state='active' AND m.account_id=a AND ac.state<>'active') ORDER BY j.id LIMIT 100 FOR UPDATE)
 UPDATE journeys.journey j SET administration='frozen',revision=revision+1,policy_generation=policy_generation+1 FROM batch WHERE j.id=batch.id;
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $$;
REVOKE ALL ON FUNCTION operations.freeze_recovered_administration(uuid) FROM PUBLIC;
ALTER TABLE identity.retired_avatar FORCE ROW LEVEL SECURITY;
REVOKE ALL ON identity.retired_avatar FROM PUBLIC,kairn_server,kairn_worker,kairn_auth;
GRANT SELECT,INSERT ON identity.retired_avatar TO kairn_command;
CREATE POLICY retired_avatar_migration ON identity.retired_avatar TO kairn_migrator USING(true) WITH CHECK(true);
CREATE POLICY retired_avatar_service ON identity.retired_avatar TO kairn_command USING(true) WITH CHECK(true);
-- Reset tokens remain Better Auth-owned. The worker gets only an event-bound boolean,
-- never a token/verification row or an arbitrary subject lookup.
GRANT SELECT(identifier,value) ON authn.verification TO kairn_command;
CREATE FUNCTION operations.reset_mail_token_current(e uuid,hash text) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
 SELECT EXISTS(SELECT FROM operations.email_delivery m JOIN authn.verification v ON v.value=m.auth_subject_id WHERE m.id=e AND m.purpose='password_reset' AND m.state='sending' AND m.expires_at>pg_catalog.clock_timestamp() AND v.expires_at>pg_catalog.clock_timestamp() AND pg_catalog.left(v.identifier,15)='reset-password:' AND pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.substr(v.identifier,16),'UTF8')),'hex')=hash)
$$;
GRANT EXECUTE ON FUNCTION operations.reset_mail_token_current(uuid,text) TO kairn_worker;
REVOKE ALL ON FUNCTION operations.reset_mail_token_current(uuid,text) FROM PUBLIC;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.reset_mail_token_current(uuid,text) OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
CREATE FUNCTION operations.mail_failure(e uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
 UPDATE operations.email_delivery SET state='failed',attempts=attempts+1,revision=revision+1,last_error_code='payload_unavailable',next_attempt_at=pg_catalog.clock_timestamp()+interval '30 seconds' WHERE id=e AND state IN ('queued','sending','failed') AND ciphertext IS NOT NULL
$$;
GRANT EXECUTE ON FUNCTION operations.mail_failure(uuid) TO kairn_worker;
REVOKE ALL ON FUNCTION operations.mail_failure(uuid) FROM PUBLIC;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.mail_failure(uuid) OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
