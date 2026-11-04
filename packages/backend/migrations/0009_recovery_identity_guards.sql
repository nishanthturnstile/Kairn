ALTER TABLE "operations"."restriction_event" ADD COLUMN "auth_subject_id" text;--> statement-breakpoint
ALTER TABLE "operations"."restriction_event" ADD CONSTRAINT "restriction_auth_subject_check" CHECK ("operations"."restriction_event"."auth_subject_id" IS NULL OR ("operations"."restriction_event"."kind" = 'account.delete' AND length("operations"."restriction_event"."auth_subject_id") BETWEEN 1 AND 512));--> statement-breakpoint
-- Preserve legacy journal bytes; capture new deletion bindings before auth cleanup.
GRANT CREATE ON SCHEMA operations TO kairn_command;
SET LOCAL ROLE kairn_command;
CREATE FUNCTION operations.restriction_payload(r operations.restriction_event,rk text,rid uuid) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT pg_catalog.jsonb_build_object('id',r.id,'kind',r.kind,'resourceKind',rk,'resourceId',rid,
 'accountId',r.account_id,'journeyId',r.journey_id,'membershipId',r.membership_id,'sourceId',r.source_id,
 'sourceGrantId',r.source_grant_id,'exportGrantId',r.export_grant_id,'invitationId',r.invitation_id,'transferId',r.transfer_id,
 'generation',r.policy_generation) || CASE WHEN r.auth_subject_id IS NOT NULL THEN pg_catalog.jsonb_build_object('version',2,'authSubjectId',r.auth_subject_id) ELSE '{}'::jsonb END
$$;
REVOKE ALL ON FUNCTION operations.restriction_payload(operations.restriction_event,text,uuid) FROM PUBLIC;
CREATE OR REPLACE FUNCTION operations.restriction_body(e uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT operations.restriction_payload(r,o.resource_kind,o.resource_id) FROM operations.restriction_event r JOIN operations.lifecycle_operation o ON o.id=r.operation_id WHERE r.id=e
$$;
CREATE FUNCTION operations.bind_account_restriction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE subject text; bindings integer; o operations.lifecycle_operation;
BEGIN
 SELECT * INTO STRICT o FROM operations.lifecycle_operation WHERE id=NEW.operation_id;
 IF o.resource_kind<>'account' OR o.resource_id IS DISTINCT FROM NEW.account_id THEN RAISE EXCEPTION 'Invalid account restriction' USING ERRCODE='23514'; END IF;
 SELECT count(DISTINCT s),min(s) INTO bindings,subject FROM (
   SELECT auth_subject_id AS s FROM identity.account WHERE id=NEW.account_id AND auth_subject_id IS NOT NULL
   UNION SELECT auth_subject_id FROM identity.retired_auth_subject WHERE account_id=NEW.account_id
 ) b;
 -- Only the migration operator may import a historical binding absent from live rows.
 IF bindings=0 AND session_user='kairn_migrator' THEN subject:=NEW.auth_subject_id; END IF;
 IF bindings>1 OR subject IS NULL OR (NEW.auth_subject_id IS NOT NULL AND NEW.auth_subject_id<>subject) THEN
   RAISE EXCEPTION 'Account restriction binding unavailable' USING ERRCODE='23514';
 END IF;
 NEW.auth_subject_id:=subject;
 NEW.integrity_sha256:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(operations.restriction_payload(NEW,o.resource_kind,o.resource_id)::text,'UTF8')),'hex');
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION operations.bind_account_restriction() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION operations.bind_account_restriction() TO kairn_migrator;
RESET ROLE;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
CREATE TRIGGER account_restriction_binding BEFORE INSERT ON operations.restriction_event FOR EACH ROW WHEN (NEW.kind='account.delete') EXECUTE FUNCTION operations.bind_account_restriction();
REVOKE EXECUTE ON FUNCTION operations.bind_account_restriction() FROM kairn_migrator;
-- Keep the opaque recovery-only binding outside API projections and direct inserts.
REVOKE SELECT,INSERT ON operations.restriction_event FROM kairn_server;
GRANT SELECT(id,operation_id,kind,account_id,journey_id,membership_id,source_id,source_grant_id,export_grant_id,invitation_id,transfer_id,policy_generation,integrity_sha256,created_at),
 INSERT(id,operation_id,kind,account_id,journey_id,membership_id,source_id,source_grant_id,export_grant_id,invitation_id,transfer_id,policy_generation,integrity_sha256,created_at) ON operations.restriction_event TO kairn_server;

CREATE OR REPLACE FUNCTION operations.replay_restriction(p jsonb,seq bigint,hash text) RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
DECLARE rk text:=p->>'resourceKind'; rid uuid:=(p->>'resourceId')::uuid; j uuid:=(p->>'journeyId')::uuid; mid uuid:=(p->>'membershipId')::uuid; now_at timestamptz:=pg_catalog.clock_timestamp(); current_seq bigint; subject text; mapped text; bindings integer;
BEGIN
 SELECT sequence INTO current_seq FROM operations.recovery_checkpoint WHERE id=1 FOR UPDATE;
 -- Validate even an already-applied prefix: an older release may have skipped
 -- a missing account and advanced its checkpoint without installing retirement.
 IF rk='account' THEN
   IF p->>'kind'<>'account.delete' THEN RAISE EXCEPTION 'Invalid account restriction' USING ERRCODE='23514'; END IF;
   SELECT count(DISTINCT s),min(s) INTO bindings,mapped FROM (
     SELECT auth_subject_id AS s FROM identity.account WHERE id=rid AND auth_subject_id IS NOT NULL
     UNION SELECT auth_subject_id FROM identity.retired_auth_subject WHERE account_id=rid
   ) b;
   subject:=CASE WHEN p->>'version'='2' THEN p->>'authSubjectId' ELSE mapped END;
   IF bindings>1 OR subject IS NULL OR length(subject) NOT BETWEEN 1 AND 512 OR (mapped IS NOT NULL AND mapped<>subject)
     OR EXISTS(SELECT FROM identity.account WHERE auth_subject_id=subject AND id<>rid)
     OR EXISTS(SELECT FROM identity.retired_auth_subject WHERE auth_subject_id=subject AND account_id<>rid)
   THEN RAISE EXCEPTION 'Account restriction binding unavailable' USING ERRCODE='23514'; END IF;
   INSERT INTO identity.account(id,auth_subject_id,state,deleted_at,policy_generation)
     VALUES(rid,CASE WHEN EXISTS(SELECT FROM authn."user" WHERE id=subject) THEN subject END,'deleting',now_at,(p->>'generation')::bigint)
     ON CONFLICT(id) DO NOTHING;
   UPDATE identity.account SET state='deleting',deleted_at=now_at,revision=revision+1,policy_generation=greatest(policy_generation+1,(p->>'generation')::bigint) WHERE id=rid AND state='active';
   INSERT INTO identity.retired_auth_subject(auth_subject_id,account_id,deny_generation)
     VALUES(subject,rid,(p->>'generation')::bigint) ON CONFLICT(auth_subject_id) DO UPDATE SET deny_generation=greatest(retired_auth_subject.deny_generation,excluded.deny_generation);
 END IF;
 IF seq<=current_seq THEN RETURN; END IF;
 IF seq<>current_seq+1 THEN RAISE EXCEPTION 'Missing ordered journal tail' USING ERRCODE='23514'; END IF;
 INSERT INTO operations.recovery_barrier(resource_kind,resource_id,generation,sequence,checkpoint_sha256) VALUES(rk,rid,(p->>'generation')::bigint,seq,hash)
 ON CONFLICT(resource_kind,resource_id) DO UPDATE SET generation=greatest(recovery_barrier.generation,excluded.generation),sequence=excluded.sequence,checkpoint_sha256=excluded.checkpoint_sha256;
 IF j IS NOT NULL THEN PERFORM 1 FROM journeys.journey WHERE id=j FOR UPDATE; END IF;
 CASE rk
 WHEN 'account' THEN NULL;
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

GRANT CREATE ON SCHEMA operations TO kairn_command;
SET LOCAL ROLE kairn_command;
CREATE OR REPLACE FUNCTION operations.begin_avatar(e uuid,ct text,bytes integer,hash text,bucket text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE a uuid; now_at timestamptz:=pg_catalog.clock_timestamp(); BEGIN
 a:=operations.command_actor();
 IF EXISTS(SELECT FROM identity.retired_avatar WHERE id=e) OR EXISTS(SELECT FROM operations.recovery_barrier WHERE resource_kind='avatar' AND resource_id=e) THEN RAISE EXCEPTION 'Avatar identity is retired' USING ERRCODE='23505'; END IF;
 INSERT INTO identity.profile_avatar(id,owner_account_id,quarantine_bucket,quarantine_key,input_content_type,input_bytes,input_sha256,created_at,upload_expires_at) VALUES(e,a,bucket,'quarantine/'||a::text||'/'||e::text,ct,bytes,hash,now_at,now_at+interval '24 hours');
 RETURN pg_catalog.jsonb_build_object('id',e,'bucket',bucket,'key','quarantine/'||a::text||'/'||e::text);
END $$;
CREATE OR REPLACE FUNCTION operations.avatar_target(e uuid,mode text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE a identity.profile_avatar; active boolean; BEGIN
 IF EXISTS(SELECT FROM operations.recovery_barrier WHERE resource_kind='avatar' AND resource_id=e) THEN RETURN NULL; END IF;
 IF mode='upload' THEN
   IF session_user<>'kairn_server' THEN RETURN NULL; END IF;
   PERFORM operations.command_actor();
 END IF;
 SELECT EXISTS(SELECT FROM identity.account ac JOIN identity.profile_avatar av ON av.owner_account_id=ac.id WHERE av.id=e AND ac.state='active') INTO active;
 SELECT * INTO a FROM identity.profile_avatar WHERE id=e AND (mode<>'upload' OR owner_account_id=nullif(pg_catalog.current_setting('kairn.account_id',true),'')::uuid) FOR UPDATE;
 IF NOT FOUND OR NOT active THEN RETURN NULL; END IF;
 IF mode='upload' THEN
   IF session_user<>'kairn_server' OR a.owner_account_id IS DISTINCT FROM nullif(pg_catalog.current_setting('kairn.account_id',true),'')::uuid OR a.state<>'pending' OR a.upload_expires_at<=pg_catalog.clock_timestamp() THEN RETURN NULL; END IF;
 ELSIF mode='process' THEN
   IF session_user<>'kairn_worker' OR NOT (a.state IN ('quarantined','processing') AND a.upload_expires_at>pg_catalog.clock_timestamp() OR a.state='available' AND a.quarantine_purged_at IS NULL) THEN RETURN NULL; END IF;
 ELSE RAISE EXCEPTION 'Invalid avatar mode' USING ERRCODE='22023'; END IF;
 RETURN pg_catalog.to_jsonb(a);
END $$;
CREATE OR REPLACE FUNCTION operations.complete_avatar(e uuid,expected bigint,bucket text,key text,hash text,bytes integer,w integer,h integer,iw integer,ih integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE av identity.profile_avatar; BEGIN
 IF EXISTS(SELECT FROM operations.recovery_barrier WHERE resource_kind='avatar' AND resource_id=e) THEN RETURN false; END IF;
 SELECT * INTO av FROM identity.profile_avatar WHERE id=e;
 -- Account before avatar, including the final check after potentially slow decoding/storage.
 PERFORM 1 FROM identity.account WHERE id=av.owner_account_id AND state='active' FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 SELECT * INTO av FROM identity.profile_avatar WHERE id=e FOR UPDATE;
 IF bucket<>av.quarantine_bucket OR key<>'avatars/'||av.owner_account_id::text||'/'||av.id::text||'.jpg' THEN RAISE EXCEPTION 'Invalid sanitized location' USING ERRCODE='23514'; END IF;
 IF av.state='available' AND av.representation_key=key AND av.representation_sha256=hash THEN RETURN true; END IF;
 IF av.state<>'quarantined' OR av.revision<>expected OR av.upload_expires_at<=pg_catalog.clock_timestamp() THEN RETURN false; END IF;
 UPDATE identity.profile_avatar SET state='processing',verified_input_width=iw,verified_input_height=ih,revision=revision+1 WHERE id=e;
 UPDATE identity.profile_avatar SET state='superseded',revision=revision+1 WHERE owner_account_id=av.owner_account_id AND state='available';
 UPDATE identity.profile_avatar SET state='available',representation_bucket=bucket,representation_key=key,representation_content_type='image/jpeg',representation_bytes=bytes,representation_sha256=hash,width=w,height=h,revision=revision+1 WHERE id=e;
 UPDATE identity.profile SET avatar_id=e,revision=revision+1 WHERE account_id=av.owner_account_id;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION operations.read_avatar() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE result jsonb; BEGIN
 PERFORM operations.command_actor();
 SELECT pg_catalog.to_jsonb(av) INTO result FROM identity.profile p JOIN identity.profile_avatar av ON av.id=p.avatar_id WHERE p.account_id=nullif(pg_catalog.current_setting('kairn.account_id',true),'')::uuid AND av.state='available' AND NOT EXISTS(SELECT FROM operations.recovery_barrier WHERE resource_kind='avatar' AND resource_id=av.id) FOR SHARE OF av;
 RETURN result;
END;
$$;
RESET ROLE;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
