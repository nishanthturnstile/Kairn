-- Named mail/media operations; workers have no table-wide domain ACLs.
GRANT USAGE ON SCHEMA authn TO kairn_command;
GRANT SELECT(id,email,email_verified) ON authn."user" TO kairn_command;
CREATE FUNCTION operations.enqueue_auth_email(e uuid,purpose text,subject text,recipient_key text,generation bigint,expires timestamptz,key_id text,cipher text,nonce text,tag text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN
 IF purpose NOT IN ('verification','password_reset') OR NOT EXISTS(SELECT FROM authn."user" WHERE id=subject) OR EXISTS(SELECT FROM identity.retired_auth_subject WHERE auth_subject_id=subject) OR EXISTS(SELECT FROM identity.account WHERE auth_subject_id=subject AND state<>'active') THEN RAISE EXCEPTION 'Mail target unavailable' USING ERRCODE='42501'; END IF;
 INSERT INTO operations.email_delivery(id,purpose,auth_subject_id,recipient_key,policy_generation,key_id,ciphertext,nonce,authentication_tag,created_at,expires_at,payload_purge_after)
 VALUES(e,purpose,subject,recipient_key,generation,key_id,pg_catalog.decode(cipher,'hex'),pg_catalog.decode(nonce,'hex'),pg_catalog.decode(tag,'hex'),pg_catalog.clock_timestamp(),expires,expires+interval '1 hour');
END $$;
CREATE FUNCTION operations.claim_email(e uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE m operations.email_delivery; email text; valid boolean:=false; j uuid; BEGIN
 -- Authority rows precede the delivery row. Every retry re-resolves current bindings.
 SELECT coalesce(i.journey_id,t.journey_id) INTO j FROM operations.email_delivery d LEFT JOIN journeys.invitation i ON i.id=d.invitation_id LEFT JOIN journeys.administration_transfer t ON t.id=d.transfer_id WHERE d.id=e;
 IF j IS NOT NULL THEN PERFORM 1 FROM journeys.journey WHERE id=j FOR UPDATE; END IF;
 SELECT * INTO m FROM operations.email_delivery WHERE id=e FOR UPDATE;
 IF NOT FOUND OR m.state IN ('smtp_accepted','expired','cancelled') THEN RETURN NULL; END IF;
 IF m.auth_subject_id IS NOT NULL THEN
   SELECT u.email INTO email FROM authn."user" u WHERE u.id=m.auth_subject_id AND (m.purpose<>'verification' OR NOT u.email_verified);
   valid:=FOUND AND NOT EXISTS(SELECT FROM identity.retired_auth_subject WHERE auth_subject_id=m.auth_subject_id) AND NOT EXISTS(SELECT FROM identity.account WHERE auth_subject_id=m.auth_subject_id AND (state<>'active' OR policy_generation<>m.policy_generation));
 ELSIF m.invitation_id IS NOT NULL THEN
   SELECT g.recipient_email INTO email FROM journeys.invitation i JOIN journeys.recipient_guard g ON g.id=i.guard_id JOIN journeys.journey jj ON jj.id=i.journey_id WHERE i.id=m.invitation_id AND i.state='pending' AND i.expires_at>pg_catalog.clock_timestamp() AND i.admission_epoch=g.admission_epoch AND jj.lifecycle='active' AND jj.administration='assigned' AND i.revision=m.policy_generation AND EXISTS(SELECT FROM identity.account WHERE id=i.inviter_account_id AND state='active') AND (g.bound_account_id IS NULL OR EXISTS(SELECT FROM identity.account WHERE id=g.bound_account_id AND state='active'));
   valid:=FOUND;
 ELSIF m.transfer_id IS NOT NULL THEN
   SELECT u.email INTO email FROM journeys.administration_transfer t JOIN journeys.journey jj ON jj.id=t.journey_id JOIN identity.account a ON a.id=t.target_account_id JOIN authn."user" u ON u.id=a.auth_subject_id WHERE t.id=m.transfer_id AND t.state='offered' AND t.expires_at>pg_catalog.clock_timestamp() AND jj.policy_generation=t.journey_policy_generation AND t.revision=m.policy_generation AND a.state='active' AND EXISTS(SELECT FROM identity.account WHERE id=t.offering_account_id AND state='active');
   valid:=FOUND;
 ELSE SELECT u.email INTO email FROM identity.account a JOIN authn."user" u ON u.id=a.auth_subject_id WHERE a.id=m.recipient_account_id AND a.state='active' AND a.policy_generation=m.policy_generation; valid:=FOUND;
 END IF;
 IF NOT valid OR m.expires_at<=pg_catalog.clock_timestamp() OR m.ciphertext IS NULL THEN
   UPDATE operations.email_delivery SET state=CASE WHEN m.expires_at<=pg_catalog.clock_timestamp() THEN 'expired' ELSE 'cancelled' END,revision=revision+1,ciphertext=NULL,key_id=NULL,nonce=NULL,authentication_tag=NULL,last_error_code=CASE WHEN m.expires_at<=pg_catalog.clock_timestamp() THEN 'expired' ELSE 'invalidated' END WHERE id=e;
   RETURN NULL;
 END IF;
 UPDATE operations.email_delivery SET state='sending',attempts=attempts+1,revision=revision+1 WHERE id=e;
 RETURN pg_catalog.jsonb_build_object('id',m.id,'purpose',m.purpose,'generation',m.policy_generation,'recipientKey',m.recipient_key,'recipient',email,'expiresAt',m.expires_at,'keyId',m.key_id,'ciphertext',pg_catalog.encode(m.ciphertext,'hex'),'nonce',pg_catalog.encode(m.nonce,'hex'),'tag',pg_catalog.encode(m.authentication_tag,'hex'));
END $$;
CREATE FUNCTION operations.finish_email(e uuid, accepted boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN
 UPDATE operations.email_delivery SET state=CASE WHEN accepted IS NULL THEN 'cancelled' WHEN accepted THEN 'smtp_accepted' ELSE 'failed' END,revision=revision+1,smtp_accepted_at=CASE WHEN accepted THEN pg_catalog.clock_timestamp() ELSE NULL END,last_error_code=CASE WHEN accepted IS NULL THEN 'invalidated' WHEN accepted THEN NULL ELSE 'smtp_unavailable' END,
 ciphertext=CASE WHEN accepted OR accepted IS NULL THEN NULL ELSE ciphertext END,key_id=CASE WHEN accepted OR accepted IS NULL THEN NULL ELSE key_id END,nonce=CASE WHEN accepted OR accepted IS NULL THEN NULL ELSE nonce END,authentication_tag=CASE WHEN accepted OR accepted IS NULL THEN NULL ELSE authentication_tag END WHERE id=e AND state='sending';
END $$;
CREATE FUNCTION operations.purge_expired_mail() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE n integer; BEGIN
 WITH batch AS(SELECT id FROM operations.email_delivery WHERE payload_purge_after<=pg_catalog.clock_timestamp() AND ciphertext IS NOT NULL ORDER BY payload_purge_after,id LIMIT 100 FOR UPDATE SKIP LOCKED)
 UPDATE operations.email_delivery SET state=CASE WHEN state IN ('queued','sending','failed') THEN 'expired' ELSE state END,revision=revision+1,ciphertext=NULL,key_id=NULL,nonce=NULL,authentication_tag=NULL FROM batch WHERE email_delivery.id=batch.id;
 GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $$;

CREATE FUNCTION operations.begin_avatar(e uuid,ct text,bytes integer,hash text,bucket text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE a uuid; now_at timestamptz:=pg_catalog.clock_timestamp(); BEGIN
 a:=operations.command_actor();
 IF EXISTS(SELECT FROM identity.retired_avatar WHERE id=e) THEN RAISE EXCEPTION 'Avatar identity is retired' USING ERRCODE='23505'; END IF;
 INSERT INTO identity.profile_avatar(id,owner_account_id,quarantine_bucket,quarantine_key,input_content_type,input_bytes,input_sha256,created_at,upload_expires_at) VALUES(e,a,bucket,'quarantine/'||a::text||'/'||e::text,ct,bytes,hash,now_at,now_at+interval '24 hours');
 RETURN pg_catalog.jsonb_build_object('id',e,'bucket',bucket,'key','quarantine/'||a::text||'/'||e::text);
END $$;
CREATE FUNCTION operations.avatar_target(e uuid,mode text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE a identity.profile_avatar; active boolean; BEGIN
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
CREATE FUNCTION operations.quarantine_avatar(e uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN
 IF operations.avatar_target(e,'upload') IS NULL THEN RAISE EXCEPTION 'Avatar unavailable' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT FROM identity.profile_avatar WHERE id=e AND uploaded_at IS NOT NULL) THEN RAISE EXCEPTION 'Avatar upload is incomplete' USING ERRCODE='42501'; END IF;
 UPDATE identity.profile_avatar SET state='quarantined',revision=revision+1 WHERE id=e;
END $$;
CREATE FUNCTION operations.complete_avatar(e uuid,expected bigint,bucket text,key text,hash text,bytes integer,w integer,h integer,iw integer,ih integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE av identity.profile_avatar; BEGIN
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
CREATE FUNCTION operations.fail_avatar(e uuid,code text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN UPDATE identity.profile_avatar SET state='failed',failure_code=code,revision=revision+1 WHERE id=e AND state IN ('pending','quarantined','processing'); END $$;
CREATE FUNCTION operations.read_avatar() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE result jsonb; BEGIN
 PERFORM operations.command_actor();
 SELECT pg_catalog.to_jsonb(av) INTO result FROM identity.profile p JOIN identity.profile_avatar av ON av.id=p.avatar_id WHERE p.account_id=nullif(pg_catalog.current_setting('kairn.account_id',true),'')::uuid AND av.state='available' FOR SHARE OF av;
 RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION operations.enqueue_auth_email(uuid,text,text,text,bigint,timestamptz,text,text,text,text) TO kairn_auth;
GRANT EXECUTE ON FUNCTION operations.claim_email(uuid),operations.finish_email(uuid,boolean),operations.purge_expired_mail(),operations.complete_avatar(uuid,bigint,text,text,text,integer,integer,integer,integer,integer),operations.fail_avatar(uuid,text) TO kairn_worker;
GRANT EXECUTE ON FUNCTION operations.read_avatar() TO kairn_server;
-- One function has disjoint modes: the API may only access its own pending upload;
-- workers may only use a persisted quarantined target. Function checks session_user.
GRANT EXECUTE ON FUNCTION operations.avatar_target(uuid,text) TO kairn_server,kairn_worker;
GRANT CREATE ON SCHEMA operations TO kairn_command;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='operations' AND p.proname IN ('enqueue_auth_email','claim_email','finish_email','purge_expired_mail','begin_avatar','avatar_target','quarantine_avatar','complete_avatar','fail_avatar','read_avatar') LOOP
 EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.sig);
 EXECUTE pg_catalog.format('ALTER FUNCTION %s OWNER TO kairn_command',f.sig);
 END LOOP;
END $$;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
-- Bounded reconciliation continues after queue retry exhaustion or a worker restart.
CREATE FUNCTION operations.pending_work() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$ BEGIN RETURN (
 SELECT coalesce(pg_catalog.jsonb_agg(work),'[]'::jsonb) FROM (
 (SELECT pg_catalog.jsonb_build_object('type','restriction','eventId',event_id) AS work FROM operations.restriction_delivery WHERE state='pending' AND next_attempt_at<=pg_catalog.clock_timestamp() ORDER BY next_attempt_at,event_id LIMIT 20)
 UNION ALL (SELECT pg_catalog.jsonb_build_object('type','email','eventId',id) FROM operations.email_delivery WHERE state IN ('queued','failed','sending') AND next_attempt_at<=pg_catalog.clock_timestamp() AND expires_at>pg_catalog.clock_timestamp() ORDER BY next_attempt_at,id LIMIT 20)
 UNION ALL (SELECT pg_catalog.jsonb_build_object('type','avatar','eventId',id) FROM identity.profile_avatar WHERE state='quarantined' AND upload_expires_at>pg_catalog.clock_timestamp() OR state='available' AND quarantine_purged_at IS NULL ORDER BY id LIMIT 20)
 UNION ALL (SELECT pg_catalog.jsonb_build_object('type','cleanup','eventId',id) FROM operations.lifecycle_operation WHERE action IN ('account.delete','journey.delete') AND state<>'complete' AND processed_units=0 ORDER BY id LIMIT 20)
 ) r); END
$$;
CREATE FUNCTION operations.avatar_cleanup_batch() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE ac record; av record; result jsonb:='[]'::jsonb; BEGIN
 FOR ac IN SELECT DISTINCT owner_account_id FROM identity.profile_avatar WHERE state IN ('failed','superseded','deleting') OR (state IN ('pending','quarantined','processing') AND upload_expires_at<=pg_catalog.clock_timestamp()) OR owner_account_id IN(SELECT id FROM identity.account WHERE state<>'active') ORDER BY owner_account_id LIMIT 20 LOOP
   PERFORM 1 FROM identity.account WHERE id=ac.owner_account_id FOR UPDATE SKIP LOCKED;
   IF NOT FOUND THEN CONTINUE; END IF;
   FOR av IN SELECT * FROM identity.profile_avatar WHERE owner_account_id=ac.owner_account_id AND (state IN ('failed','superseded','deleting') OR (state IN ('pending','quarantined','processing') AND upload_expires_at<=pg_catalog.clock_timestamp()) OR EXISTS(SELECT FROM identity.account WHERE id=ac.owner_account_id AND state<>'active')) ORDER BY id LIMIT 20 FOR UPDATE SKIP LOCKED LOOP
     UPDATE identity.profile SET avatar_id=NULL,revision=revision+1 WHERE avatar_id=av.id;
     UPDATE identity.profile_avatar SET state='deleting',revision=revision+1 WHERE id=av.id AND state<>'deleting';
     result:=result||pg_catalog.jsonb_build_array(pg_catalog.to_jsonb(av));
     IF pg_catalog.jsonb_array_length(result)>=20 THEN RETURN result; END IF;
   END LOOP;
 END LOOP;
 RETURN result;
END $$;
CREATE FUNCTION operations.finish_avatar_cleanup(e uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE owner_id uuid; avatar_revision bigint; generation bigint; o record; now_at timestamptz; BEGIN
 UPDATE identity.profile_avatar SET state='deleted',deleted_at=pg_catalog.clock_timestamp(),revision=revision+1 WHERE id=e AND state='deleting' RETURNING owner_account_id,revision INTO owner_id,avatar_revision;
 IF NOT FOUND THEN RETURN; END IF;
 INSERT INTO identity.retired_avatar(id,owner_account_id) VALUES(e,owner_id) ON CONFLICT(id) DO NOTHING;
 DELETE FROM identity.profile_avatar WHERE id=e;
 FOR o IN SELECT * FROM operations.lifecycle_operation WHERE resource_kind='avatar' AND resource_id=e AND state<>'complete' AND processed_units=0 ORDER BY id FOR UPDATE LOOP
   now_at:=greatest(pg_catalog.clock_timestamp(),o.updated_at);
   UPDATE operations.lifecycle_operation SET processed_units=1,total_units=1,state=CASE WHEN o.recovery_state='confirmed' THEN 'complete' ELSE 'processing' END,terminal_at=CASE WHEN o.recovery_state='confirmed' THEN now_at END,revision=o.revision+1,updated_at=now_at WHERE id=o.id;
 END LOOP;
 SELECT policy_generation INTO generation FROM identity.account WHERE id=owner_id;
 INSERT INTO operations.audit_event(actor_kind,service_name,action,subject_account_id,target_id,revision,policy_generation) VALUES('service','identity_media_worker','cleanup.complete',owner_id,e,avatar_revision,generation);
END $$;
GRANT DELETE ON identity.profile_avatar TO kairn_command;
GRANT EXECUTE ON FUNCTION operations.pending_work(),operations.avatar_cleanup_batch(),operations.finish_avatar_cleanup(uuid) TO kairn_worker;
GRANT CREATE ON SCHEMA operations TO kairn_command;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='operations' AND p.proname IN ('pending_work','avatar_cleanup_batch','finish_avatar_cleanup') LOOP
 EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.sig);
 EXECUTE pg_catalog.format('ALTER FUNCTION %s OWNER TO kairn_command',f.sig);
 END LOOP;
END $$;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
GRANT SELECT(user_id),DELETE ON authn.session TO kairn_command;
GRANT DELETE ON authn."user",operations.email_delivery TO kairn_command;
CREATE FUNCTION operations.account_cleanup_unit(e uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE o operations.lifecycle_operation; j uuid; subject text; now_at timestamptz:=pg_catalog.clock_timestamp(); BEGIN
 SELECT * INTO o FROM operations.lifecycle_operation WHERE id=e AND action='account.delete' AND state<>'complete' AND processed_units=0;
 IF NOT FOUND THEN
   IF NOT EXISTS(SELECT FROM operations.recovery_barrier b JOIN identity.account a ON a.id=b.resource_id WHERE b.resource_kind='account' AND b.resource_id=e AND a.state='deleting') THEN RETURN false; END IF;
   o.actor_account_id:=e;o.id:=NULL;
 END IF;
 -- Account-level deny has already committed. Each call processes one ordered journey.
 SELECT journey_id INTO j FROM (
 SELECT journey_id FROM journeys.membership WHERE account_id=o.actor_account_id AND state='active'
 UNION SELECT journey_id FROM sources.source_grant WHERE owner_account_id=o.actor_account_id AND state='active'
 UNION SELECT journey_id FROM sources.export_grant WHERE (owner_account_id=o.actor_account_id OR recipient_account_id=o.actor_account_id) AND state='active'
 UNION SELECT journey_id FROM journeys.recipient_guard WHERE bound_account_id=o.actor_account_id AND EXISTS(SELECT FROM journeys.invitation WHERE guard_id=recipient_guard.id AND state='pending')
 ) candidates ORDER BY journey_id LIMIT 1;
 IF j IS NOT NULL THEN
   PERFORM 1 FROM journeys.journey WHERE id=j FOR UPDATE;
   UPDATE journeys.membership SET state='removed',ended_at=now_at,end_reason='removed',revision=revision+1 WHERE journey_id=j AND account_id=o.actor_account_id AND state='active';
   UPDATE journeys.member_capability c SET state='revoked',revoked_at=now_at,revoked_by=o.actor_account_id,revision=c.revision+1 FROM journeys.membership m WHERE c.membership_id=m.id AND m.journey_id=j AND m.account_id=o.actor_account_id AND c.state='active';
   UPDATE journeys.journey SET administration=CASE WHEN NOT EXISTS(SELECT FROM journeys.member_capability WHERE journey_id=j AND capability='administrator' AND state='active') THEN 'frozen' ELSE administration END,revision=revision+1,policy_generation=policy_generation+1 WHERE id=j;
   WITH batch AS(SELECT id FROM sources.source_grant WHERE journey_id=j AND owner_account_id=o.actor_account_id AND state='active' ORDER BY id LIMIT 100 FOR UPDATE)
   UPDATE sources.source_grant SET state='withdrawn',scope='only_me',changed_by=NULL,changed_at=now_at,revision=revision+1 FROM batch WHERE source_grant.id=batch.id;
   WITH batch AS(SELECT id FROM sources.export_grant WHERE journey_id=j AND (owner_account_id=o.actor_account_id OR recipient_account_id=o.actor_account_id) AND state='active' ORDER BY id LIMIT 100 FOR UPDATE)
   UPDATE sources.export_grant SET state='invalidated',closed_at=now_at,revision=revision+1 FROM batch WHERE export_grant.id=batch.id;
   UPDATE journeys.recipient_guard SET admission_epoch=admission_epoch+1,revision=revision+1 WHERE journey_id=j AND bound_account_id=o.actor_account_id AND EXISTS(SELECT FROM journeys.invitation WHERE guard_id=recipient_guard.id AND state='pending');
   RETURN true;
 END IF;
 -- Avatars are removed by the bounded object cleaner; do not claim byte cleanup early.
 IF EXISTS(SELECT FROM identity.profile_avatar WHERE owner_account_id=o.actor_account_id) THEN RETURN true; END IF;
 PERFORM 1 FROM identity.account WHERE id=o.actor_account_id FOR UPDATE;
 IF o.id IS NOT NULL THEN
   SELECT * INTO o FROM operations.lifecycle_operation WHERE id=e FOR UPDATE;
   IF o.state='complete' THEN RETURN false; END IF;
 END IF;
 SELECT auth_subject_id INTO subject FROM identity.account WHERE id=o.actor_account_id;
 DELETE FROM operations.email_delivery WHERE auth_subject_id=subject;
 UPDATE identity.profile SET display_name='Deleted account',bio=NULL,avatar_id=NULL,revision=revision+1 WHERE account_id=o.actor_account_id;
 UPDATE identity.account SET auth_subject_id=NULL,state='deleted',revision=revision+1,policy_generation=policy_generation+1 WHERE id=o.actor_account_id AND state='deleting';
 DELETE FROM authn."user" WHERE id=subject;
 now_at:=pg_catalog.clock_timestamp();
 UPDATE operations.lifecycle_operation SET state=CASE WHEN recovery_state='confirmed' THEN 'complete' ELSE 'processing' END,processed_units=1,total_units=1,revision=revision+1,updated_at=now_at,terminal_at=CASE WHEN recovery_state='confirmed' THEN now_at END,terminal_available_until=CASE WHEN recovery_state='confirmed' AND receipt_hard_expires_at>now_at THEN least(receipt_hard_expires_at,now_at+interval '7 days') END WHERE id=e;
 RETURN false;
END $$;
GRANT EXECUTE ON FUNCTION operations.account_cleanup_unit(uuid) TO kairn_worker;
REVOKE ALL ON FUNCTION operations.account_cleanup_unit(uuid) FROM PUBLIC;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.account_cleanup_unit(uuid) OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
CREATE FUNCTION operations.journey_cleanup_unit(e uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE o operations.lifecycle_operation; now_at timestamptz:=pg_catalog.clock_timestamp(); BEGIN
 SELECT * INTO o FROM operations.lifecycle_operation WHERE id=e AND action='journey.delete' AND state<>'complete' AND processed_units=0;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM 1 FROM journeys.journey WHERE id=o.journey_id AND lifecycle='deleted' FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 WITH batch AS(SELECT id FROM sources.source_grant WHERE journey_id=o.journey_id AND state='active' ORDER BY id LIMIT 100 FOR UPDATE)
 UPDATE sources.source_grant SET state='withdrawn',scope='only_me',changed_by=NULL,changed_at=now_at,revision=revision+1 FROM batch WHERE source_grant.id=batch.id;
 WITH batch AS(SELECT id FROM sources.export_grant WHERE journey_id=o.journey_id AND state='active' ORDER BY id LIMIT 100 FOR UPDATE)
 UPDATE sources.export_grant SET state='invalidated',closed_at=now_at,revision=revision+1 FROM batch WHERE export_grant.id=batch.id;
 IF EXISTS(SELECT FROM sources.source_grant WHERE journey_id=o.journey_id AND state='active') OR EXISTS(SELECT FROM sources.export_grant WHERE journey_id=o.journey_id AND state='active') THEN RETURN true; END IF;
 SELECT * INTO o FROM operations.lifecycle_operation WHERE id=e FOR UPDATE;
 IF o.state='complete' THEN RETURN false; END IF;
 now_at:=pg_catalog.clock_timestamp();
 UPDATE operations.lifecycle_operation SET state=CASE WHEN recovery_state='confirmed' THEN 'complete' ELSE 'processing' END,processed_units=1,total_units=1,revision=revision+1,updated_at=now_at,terminal_at=CASE WHEN recovery_state='confirmed' THEN now_at END WHERE id=e;
 RETURN false;
END $$;
CREATE FUNCTION operations.cleanup_unit(e uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN
 IF EXISTS(SELECT FROM operations.lifecycle_operation WHERE id=e AND action='journey.delete') THEN RETURN operations.journey_cleanup_unit(e); END IF;
 RETURN operations.account_cleanup_unit(e);
END $$;
GRANT EXECUTE ON FUNCTION operations.cleanup_unit(uuid) TO kairn_worker;
GRANT CREATE ON SCHEMA operations TO kairn_command;
REVOKE ALL ON FUNCTION operations.journey_cleanup_unit(uuid),operations.cleanup_unit(uuid) FROM PUBLIC;
ALTER FUNCTION operations.journey_cleanup_unit(uuid) OWNER TO kairn_command;
ALTER FUNCTION operations.cleanup_unit(uuid) OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
