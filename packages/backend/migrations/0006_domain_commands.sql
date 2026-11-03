-- B03: the API keeps its read ACLs. Only these checked functions may write.
-- The NOLOGIN owner cannot be SET ROLE'd by an application principal.
GRANT USAGE ON SCHEMA identity, journeys, sources, operations TO kairn_command;
GRANT USAGE ON SCHEMA operations TO kairn_worker, kairn_auth;
REVOKE UPDATE(display_name,bio,revision) ON identity.profile FROM kairn_server;
DROP POLICY profile_owner_update ON identity.profile;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT n.nspname, c.relname FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname IN ('identity','journeys','sources','operations') AND c.relkind='r' LOOP
    EXECUTE pg_catalog.format('GRANT SELECT, INSERT, UPDATE ON %I.%I TO kairn_command',r.nspname,r.relname);
    EXECUTE pg_catalog.format('CREATE POLICY command_service ON %I.%I TO kairn_command USING (true) WITH CHECK (true)',r.nspname,r.relname);
  END LOOP;
END $$;
GRANT USAGE ON SEQUENCE operations.domain_change_cursor_seq TO kairn_command;

CREATE FUNCTION operations.command_actor() RETURNS uuid LANGUAGE plpgsql SET search_path='' AS $$
DECLARE a uuid; BEGIN
  a := nullif(pg_catalog.current_setting('kairn.account_id',true),'')::uuid;
  PERFORM 1 FROM identity.account WHERE id=a AND state='active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
  RETURN a;
END $$;
CREATE FUNCTION operations.has_power(a uuid,j uuid,p text) RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT EXISTS(SELECT FROM journeys.membership m JOIN journeys.member_capability c ON c.membership_id=m.id AND c.membership_epoch=m.epoch
 WHERE m.account_id=a AND m.journey_id=j AND m.state='active' AND c.state='active' AND c.capability=p)
$$;
CREATE FUNCTION operations.restriction_body(e uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT pg_catalog.jsonb_build_object('id',r.id,'kind',r.kind,'resourceKind',o.resource_kind,'resourceId',o.resource_id,
 'accountId',r.account_id,'journeyId',r.journey_id,'membershipId',r.membership_id,'sourceId',r.source_id,
 'sourceGrantId',r.source_grant_id,'exportGrantId',r.export_grant_id,'invitationId',r.invitation_id,'transferId',r.transfer_id,
 'generation',r.policy_generation) FROM operations.restriction_event r JOIN operations.lifecycle_operation o ON o.id=r.operation_id WHERE r.id=e
$$;
CREATE FUNCTION operations.collaboration_open(j uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT EXISTS(SELECT FROM journeys.journey jj JOIN journeys.member_capability c ON c.journey_id=jj.id AND c.capability='administrator' AND c.state='active' JOIN journeys.membership m ON m.id=c.membership_id AND m.epoch=c.membership_epoch AND m.state='active' JOIN identity.account a ON a.id=m.account_id AND a.state='active' WHERE jj.id=j AND jj.lifecycle='active' AND jj.administration='assigned')
$$;

-- Freshness is supplied only by the session integration in transaction-local context;
-- public command payloads cannot make a session fresh. No HTTP handlers mount this yet.
CREATE FUNCTION operations.execute_command(cmd uuid, op text, p jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE a uuid; old operations.command_receipt; d text; rid uuid; rk text; rev bigint; gen bigint:=1;
 j uuid; s uuid; mid uuid; target uuid; restricted boolean:=false; kind text; oper uuid; ev uuid; audit uuid:=gen_random_uuid();
 now_at timestamptz:=pg_catalog.clock_timestamp(); jr journeys.journey; sr sources.source; gr sources.source_grant;
 mr journeys.membership; ir journeys.invitation; tr journeys.administration_transfer; er sources.export_request;
 eg sources.export_grant; ids uuid[]; asset record; asset_count integer:=0; recipient journeys.membership; body jsonb; old_scope text; status_hash text; impact operations.impact_preview; impact_action text;
BEGIN
 IF pg_catalog.octet_length(p::text)>65536 OR pg_catalog.jsonb_typeof(p)<>'object' THEN RAISE EXCEPTION 'Invalid payload' USING ERRCODE='22023'; END IF;
 a:=operations.command_actor();
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(a::text||cmd::text,0));
 d:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p::text,'UTF8')),'hex');
 SELECT * INTO old FROM operations.command_receipt WHERE actor_account_id=a AND command_id=cmd;
 IF FOUND THEN
   IF old.operation_type<>op OR old.payload_digest<>d THEN RAISE EXCEPTION 'Command identity conflict' USING ERRCODE='23505'; END IF;
   IF old.retention_state<>'live' OR old.expires_at<=now_at THEN RAISE EXCEPTION 'Command receipt expired' USING ERRCODE='P0002'; END IF;
   RETURN pg_catalog.jsonb_build_object('resourceId',old.resource_id,'resourceKind',old.resource_kind,'revision',old.resource_revision,'state',old.result_state,'replayed',true,'jobs','[]'::jsonb);
 END IF;
 -- Journey is always locked before membership, source and grant rows.
 j:=(p->>'journeyId')::uuid;
 IF j IS NOT NULL THEN
   SELECT * INTO jr FROM journeys.journey WHERE id=j FOR UPDATE;
   IF NOT FOUND OR jr.lifecycle='deleted' THEN RAISE EXCEPTION 'Journey unavailable' USING ERRCODE='42501'; END IF;
   -- Authorize the target before disclosing whether its generation changed.
   IF op IN ('journey.archive','journey.delete','membership.remove','invitation.revoke','transfer.cancel') AND NOT operations.has_power(a,j,'administrator')
      OR op='membership.leave' AND NOT EXISTS(SELECT FROM journeys.membership WHERE id=(p->>'id')::uuid AND journey_id=j AND account_id=a AND state='active')
      OR op IN ('source_scope.change','source_grant.withdraw') AND NOT EXISTS(SELECT FROM sources.source WHERE id=(p->>'sourceId')::uuid AND owner_account_id=a)
      OR op='export.request' AND NOT EXISTS(SELECT FROM journeys.membership WHERE journey_id=j AND account_id=a AND state='active')
      OR op='export.approve' AND NOT EXISTS(SELECT FROM sources.export_request WHERE id=(p->>'requestId')::uuid AND journey_id=j AND owner_account_id=a)
      OR op='export.revoke' AND NOT EXISTS(SELECT FROM sources.export_grant WHERE id=(p->>'id')::uuid AND journey_id=j AND owner_account_id=a)
   THEN RAISE EXCEPTION 'Target unavailable' USING ERRCODE='42501'; END IF;
   gen:=jr.policy_generation;
   IF (p->>'generation')::bigint IS DISTINCT FROM gen THEN RAISE EXCEPTION 'Stale generation' USING ERRCODE='40001'; END IF;
 END IF;
 impact_action:=CASE op WHEN 'journey.archive' THEN 'archive' WHEN 'journey.delete' THEN 'delete_journey' WHEN 'membership.leave' THEN 'leave' WHEN 'membership.remove' THEN 'remove_member' WHEN 'account.delete' THEN 'delete_account' END;
 IF impact_action IS NOT NULL THEN
   SELECT * INTO impact FROM operations.impact_preview WHERE id=(p->>'previewId')::uuid AND actor_account_id=a AND secret_hash=p->>'previewSecretHash' AND action=impact_action AND journey_id IS NOT DISTINCT FROM j AND consumed_command_id IS NULL AND expires_at>now_at FOR UPDATE;
   IF NOT FOUND OR impact.target_revision IS DISTINCT FROM (p->>'revision')::bigint OR impact.policy_generation IS DISTINCT FROM (p->>'generation')::bigint OR impact.target_membership_id IS DISTINCT FROM (CASE WHEN op IN ('membership.leave','membership.remove') THEN (p->>'id')::uuid END) THEN RAISE EXCEPTION 'Impact expired or changed' USING ERRCODE='40001'; END IF;
 END IF;
 CASE op
 WHEN 'account.delete' THEN
   IF nullif(pg_catalog.current_setting('kairn.session_fresh',true),'') IS DISTINCT FROM 'true' OR p->>'confirmDelete' IS DISTINCT FROM 'delete' THEN RAISE EXCEPTION 'Fresh confirmation required' USING ERRCODE='42501'; END IF;
   UPDATE identity.account SET state='deleting',deleted_at=now_at,revision=revision+1,policy_generation=policy_generation+1 WHERE id=a AND revision=(p->>'revision')::bigint AND policy_generation=(p->>'generation')::bigint RETURNING revision,policy_generation INTO rev,gen;
   IF NOT FOUND THEN RAISE EXCEPTION 'Stale account' USING ERRCODE='40001'; END IF;
   INSERT INTO identity.retired_auth_subject(auth_subject_id,account_id,deny_generation) SELECT auth_subject_id,id,policy_generation FROM identity.account WHERE id=a ON CONFLICT DO NOTHING;
   DELETE FROM authn.session WHERE user_id IN(SELECT auth_subject_id FROM identity.account WHERE id=a);
   rid:=a;rk:='account';target:=a;restricted:=true;kind:='account.delete';
 WHEN 'profile.update' THEN
   UPDATE identity.profile SET display_name=p->>'displayName',bio=p->>'bio',revision=revision+1 WHERE account_id=a AND revision=(p->>'revision')::bigint RETURNING revision INTO rev;
   IF NOT FOUND THEN RAISE EXCEPTION 'Stale profile' USING ERRCODE='40001'; END IF;
   rid:=a; rk:='profile';
 WHEN 'avatar.create' THEN
   rid:=(p->>'id')::uuid; rk:='avatar'; rev:=1;
   PERFORM operations.begin_avatar(rid,p->>'contentType',(p->>'bytes')::integer,p->>'sha256',p->>'bucket');
 WHEN 'avatar.replace' THEN
   rid:=(p->>'id')::uuid; rk:='avatar';
   PERFORM operations.quarantine_avatar(rid);
   SELECT revision INTO rev FROM identity.profile_avatar WHERE id=rid;
 WHEN 'avatar.delete' THEN
   SELECT id,revision+1 INTO rid,rev FROM identity.profile_avatar WHERE id=(p->>'id')::uuid AND owner_account_id=a AND state IN ('pending','quarantined','processing','available') AND revision=(p->>'revision')::bigint FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Avatar unavailable' USING ERRCODE='42501'; END IF;
   UPDATE identity.profile SET avatar_id=NULL,revision=revision+1 WHERE account_id=a AND avatar_id=rid;
   UPDATE identity.profile_avatar SET state='deleting',revision=revision+1 WHERE id=rid;
   rk:='avatar';restricted:=true;kind:='avatar.delete';
 WHEN 'source.register' THEN
   rid:=(p->>'id')::uuid; rk:='source'; rev:=1;
   INSERT INTO sources.source(id,owner_account_id,kind,provenance) VALUES(rid,a,p->>'kind',p->>'provenance');
 WHEN 'source_asset.register' THEN
   s:=(p->>'sourceId')::uuid; SELECT * INTO sr FROM sources.source WHERE id=s AND owner_account_id=a AND state='active' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='42501'; END IF;
   rid:=s; rk:='source'; rev:=sr.revision;
   INSERT INTO sources.source_asset(id,source_id,owner_account_id,kind) VALUES((p->>'id')::uuid,s,a,p->>'kind');
 WHEN 'source_scope.change', 'source_grant.withdraw' THEN
   s:=(p->>'sourceId')::uuid;
   SELECT * INTO sr FROM sources.source WHERE id=s AND owner_account_id=a AND state='active' FOR UPDATE;
   IF NOT FOUND OR j IS NULL THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='42501'; END IF;
   SELECT * INTO gr FROM sources.source_grant WHERE source_id=s AND journey_id=j FOR UPDATE;
   old_scope:=CASE WHEN gr.state='active' THEN gr.scope ELSE 'only_me' END;
   kind:=CASE WHEN op='source_grant.withdraw' THEN 'only_me' ELSE p->>'scope' END;
   IF coalesce(gr.revision,0) IS DISTINCT FROM (p->>'revision')::bigint THEN RAISE EXCEPTION 'Stale grant' USING ERRCODE='40001'; END IF;
   restricted:=(old_scope='publication_reuse' AND kind IN ('journey_review','only_me')) OR (old_scope='journey_review' AND kind='only_me');
   IF NOT restricted AND (NOT operations.collaboration_open(j) OR NOT EXISTS(SELECT FROM journeys.membership WHERE journey_id=j AND account_id=a AND state='active')) THEN RAISE EXCEPTION 'Expansion unavailable' USING ERRCODE='42501'; END IF;
   rid:=coalesce(gr.id,(p->>'id')::uuid); rk:='source_grant'; rev:=coalesce(gr.revision,0)+1;
   INSERT INTO sources.source_grant(id,source_id,journey_id,owner_account_id,scope,state,changed_by) VALUES(rid,s,j,a,kind,CASE WHEN kind='only_me' THEN 'withdrawn' ELSE 'active' END,a)
   ON CONFLICT(source_id,journey_id) DO UPDATE SET scope=excluded.scope,state=excluded.state,revision=sources.source_grant.revision+1,changed_by=a,changed_at=now_at;
   kind:=CASE WHEN kind='only_me' THEN 'source.withdraw' ELSE 'source.narrow' END;
 WHEN 'export.request' THEN
   IF j IS NULL THEN RAISE EXCEPTION 'Journey required' USING ERRCODE='22023'; END IF;
   SELECT * INTO recipient FROM journeys.membership WHERE journey_id=j AND account_id=a AND state='active' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Recipient unavailable' USING ERRCODE='42501'; END IF;
   target:=(p->>'ownerId')::uuid;
   SELECT array_agg(value::uuid ORDER BY value::uuid) INTO ids FROM pg_catalog.jsonb_array_elements_text(p->'assetIds');
   IF cardinality(ids) NOT BETWEEN 1 AND 100 OR cardinality(ids)<>(SELECT count(DISTINCT x) FROM unnest(ids) x) THEN RAISE EXCEPTION 'Exact asset set required' USING ERRCODE='22023'; END IF;
   -- Lock every source before any grant/asset in UUID order.
   PERFORM 1 FROM sources.source WHERE id IN(SELECT source_id FROM sources.source_asset WHERE id=ANY(ids)) ORDER BY id FOR UPDATE;
   PERFORM 1 FROM sources.source_grant WHERE journey_id=j AND source_id IN(SELECT source_id FROM sources.source_asset WHERE id=ANY(ids)) ORDER BY id FOR UPDATE;
   rid:=(p->>'id')::uuid; rk:='export_request'; rev:=1;
   INSERT INTO sources.export_request(id,owner_account_id,journey_id,requester_account_id,requester_membership_id,requester_epoch,expires_at) VALUES(rid,target,j,a,recipient.id,recipient.epoch,now_at+interval '24 hours');
   FOR asset IN SELECT sa.*,sg.id AS grant_id,sg.revision AS grant_revision FROM sources.source_asset sa JOIN sources.source_grant sg ON sg.source_id=sa.source_id AND sg.journey_id=j WHERE sa.id=ANY(ids) ORDER BY sa.id LOOP
     asset_count:=asset_count+1;
     IF asset.owner_account_id<>target OR asset.state<>'verified' THEN RAISE EXCEPTION 'Asset unavailable' USING ERRCODE='42501'; END IF;
     INSERT INTO sources.export_request_asset(request_id,asset_id,source_id,owner_account_id,journey_id,source_grant_id,asset_revision,source_grant_revision) VALUES(rid,asset.id,asset.source_id,target,j,asset.grant_id,asset.revision,asset.grant_revision);
   END LOOP;
   IF asset_count<>cardinality(ids) THEN RAISE EXCEPTION 'Exact asset set unavailable' USING ERRCODE='42501'; END IF;
 WHEN 'export.approve' THEN
   SELECT * INTO er FROM sources.export_request WHERE id=(p->>'requestId')::uuid AND owner_account_id=a AND journey_id=j FOR UPDATE;
   IF NOT FOUND OR er.state<>'requested' OR er.expires_at<=now_at THEN RAISE EXCEPTION 'Request unavailable' USING ERRCODE='42501'; END IF;
   IF er.revision IS DISTINCT FROM (p->>'revision')::bigint THEN RAISE EXCEPTION 'Stale request' USING ERRCODE='40001'; END IF;
   PERFORM 1 FROM journeys.membership WHERE id=er.requester_membership_id AND state='active' AND epoch=er.requester_epoch FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Recipient unavailable' USING ERRCODE='42501'; END IF;
   PERFORM 1 FROM sources.source WHERE id IN(SELECT source_id FROM sources.export_request_asset WHERE request_id=er.id) ORDER BY id FOR UPDATE;
   PERFORM 1 FROM sources.source_grant WHERE id IN(SELECT source_grant_id FROM sources.export_request_asset WHERE request_id=er.id) ORDER BY id FOR UPDATE;
   rid:=(p->>'id')::uuid; rk:='export_grant'; rev:=1;
   UPDATE sources.export_request SET state='approved',revision=revision+1,closed_at=now_at WHERE id=er.id;
   INSERT INTO sources.export_grant(id,request_id,owner_account_id,journey_id,recipient_account_id,recipient_membership_id,recipient_epoch,issued_at,expires_at) VALUES(rid,er.id,a,j,er.requester_account_id,er.requester_membership_id,er.requester_epoch,now_at,now_at+((p->>'hours')::integer * interval '1 hour'));
   INSERT INTO sources.export_grant_asset(grant_id,request_id,asset_id,source_id,owner_account_id,journey_id,source_grant_id,asset_revision,source_grant_revision) SELECT rid,request_id,asset_id,source_id,owner_account_id,journey_id,source_grant_id,asset_revision,source_grant_revision FROM sources.export_request_asset WHERE request_id=er.id;
 WHEN 'export.revoke' THEN
   SELECT * INTO eg FROM sources.export_grant WHERE id=(p->>'id')::uuid AND owner_account_id=a AND journey_id=j FOR UPDATE;
   IF NOT FOUND OR eg.state<>'active' THEN RAISE EXCEPTION 'Grant unavailable' USING ERRCODE='42501'; END IF;
   IF eg.revision IS DISTINCT FROM (p->>'revision')::bigint THEN RAISE EXCEPTION 'Stale grant' USING ERRCODE='40001'; END IF;
   UPDATE sources.export_grant SET state='revoked',revision=revision+1,closed_at=now_at WHERE id=eg.id RETURNING revision INTO rev;
   target:=eg.recipient_account_id;
   rid:=eg.id; rk:='export_grant'; restricted:=true; kind:='export.revoke';
 WHEN 'journey.archive','journey.delete','membership.leave','membership.remove','invitation.revoke','transfer.cancel' THEN
   IF j IS NULL THEN RAISE EXCEPTION 'Journey required' USING ERRCODE='22023'; END IF;
   IF op<>'membership.leave' AND NOT operations.has_power(a,j,'administrator') THEN RAISE EXCEPTION 'Administrator required' USING ERRCODE='42501'; END IF;
   IF jr.policy_generation IS DISTINCT FROM (p->>'generation')::bigint THEN RAISE EXCEPTION 'Stale generation' USING ERRCODE='40001'; END IF;
   IF nullif(pg_catalog.current_setting('kairn.session_fresh',true),'') IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Fresh session required' USING ERRCODE='42501'; END IF;
   restricted:=true; kind:=op;
   IF op IN ('journey.archive','journey.delete') THEN
     IF jr.revision IS DISTINCT FROM (p->>'revision')::bigint THEN RAISE EXCEPTION 'Stale journey' USING ERRCODE='40001'; END IF;
     IF op='journey.delete' AND (p->>'confirmTitle' IS DISTINCT FROM jr.title OR p->>'confirmDelete' IS DISTINCT FROM 'delete') THEN RAISE EXCEPTION 'Named confirmations required' USING ERRCODE='22023'; END IF;
     IF op='journey.delete' THEN
       UPDATE journeys.membership SET state='removed',ended_at=now_at,end_reason='journey_deleted',revision=revision+1 WHERE journey_id=j AND state='active';
       UPDATE journeys.member_capability SET state='revoked',revoked_at=now_at,revoked_by=a,revision=revision+1 WHERE journey_id=j AND state='active';
     END IF;
     UPDATE journeys.journey SET lifecycle=CASE WHEN op='journey.archive' THEN 'archived' ELSE 'deleted' END,deleted_at=CASE WHEN op='journey.delete' THEN now_at ELSE NULL END,revision=revision+1,policy_generation=policy_generation+1 WHERE id=j RETURNING revision,policy_generation INTO rev,gen;
     rid:=j; rk:='journey';
   ELSIF op IN ('membership.leave','membership.remove') THEN
     SELECT * INTO mr FROM journeys.membership WHERE id=(p->>'id')::uuid AND journey_id=j AND state='active' FOR UPDATE;
     IF NOT FOUND OR (op='membership.leave' AND mr.account_id<>a) OR (op='membership.remove' AND mr.account_id=a) THEN RAISE EXCEPTION 'Membership unavailable' USING ERRCODE='42501'; END IF;
     IF mr.revision IS DISTINCT FROM (p->>'revision')::bigint THEN RAISE EXCEPTION 'Stale membership' USING ERRCODE='40001'; END IF;
     mid:=mr.id; target:=mr.account_id;
     UPDATE journeys.membership SET state=CASE WHEN op='membership.leave' THEN 'left' ELSE 'removed' END,ended_at=now_at,end_reason=CASE WHEN op='membership.leave' THEN 'left' ELSE 'removed' END,revision=revision+1 WHERE id=mid RETURNING revision INTO rev;
     UPDATE journeys.member_capability SET state='revoked',revoked_at=now_at,revoked_by=a,revision=revision+1 WHERE membership_id=mid AND state='active';
     UPDATE journeys.journey SET administration=CASE WHEN NOT EXISTS(SELECT FROM journeys.member_capability WHERE journey_id=j AND capability='administrator' AND state='active') THEN 'frozen' ELSE administration END,revision=revision+1,policy_generation=policy_generation+1 WHERE id=j RETURNING policy_generation INTO gen;
     rid:=mid; rk:='membership';
   ELSIF op='invitation.revoke' THEN
     UPDATE journeys.invitation SET state='revoked',closed_at=now_at,revision=revision+1 WHERE id=(p->>'id')::uuid AND journey_id=j AND state='pending' AND revision=(p->>'revision')::bigint RETURNING id,revision INTO rid,rev;
     SELECT g.bound_account_id INTO target FROM journeys.invitation i JOIN journeys.recipient_guard g ON g.id=i.guard_id WHERE i.id=rid;
     rk:='invitation';
   ELSE
     UPDATE journeys.administration_transfer SET state='cancelled',closed_at=now_at,revision=revision+1 WHERE id=(p->>'id')::uuid AND journey_id=j AND state='offered' AND revision=(p->>'revision')::bigint RETURNING id,revision,target_account_id INTO rid,rev,target;
     rk:='transfer';
   END IF;
   IF rid IS NULL THEN RAISE EXCEPTION 'Stale target' USING ERRCODE='40001'; END IF;
 ELSE RAISE EXCEPTION 'Unsupported command' USING ERRCODE='22023';
 END CASE;
 oper:=CASE WHEN restricted THEN gen_random_uuid() ELSE NULL END;
 status_hash:=p->>'statusReceiptHash';
 INSERT INTO operations.command_receipt(actor_account_id,command_id,operation_type,payload_digest,result_state,resource_kind,resource_id,resource_revision,created_at,expires_at)
 VALUES(a,cmd,op,d,CASE WHEN restricted THEN 'restriction_pending' ELSE 'accepted' END,CASE WHEN restricted THEN 'lifecycle_operation' ELSE rk END,coalesce(oper,rid),rev,now_at,now_at+interval '30 days');
 IF impact_action IS NOT NULL THEN UPDATE operations.impact_preview SET consumed_command_id=cmd,consumed_at=now_at WHERE id=impact.id; END IF;
 INSERT INTO operations.audit_event(id,actor_kind,actor_account_id,command_id,action,journey_id,source_id,subject_account_id,target_id,revision,policy_generation) VALUES(audit,'account',a,cmd,op,j,s,target,rid,rev,gen);
 -- Private source/export changes never appear in a journey-wide change stream.
 INSERT INTO operations.domain_change(scope,account_id,journey_id,actor_account_id,command_id,target_kind,target_id,revision,policy_generation,tombstone)
 VALUES(CASE WHEN rk='journey' THEN 'journey' ELSE 'account' END,CASE WHEN rk='journey' THEN NULL ELSE a END,CASE WHEN rk='journey' THEN j ELSE NULL END,a,cmd,CASE WHEN rk IN ('source','avatar','export_request') THEN 'account' ELSE rk END,CASE WHEN rk IN ('source','avatar','export_request') THEN a ELSE rid END,rev,gen,restricted);
 IF target IS NOT NULL AND target<>a THEN INSERT INTO operations.account_notice(recipient_account_id,event_id,kind,journey_id) VALUES(target,audit,'lifecycle',j); END IF;
 IF restricted AND j IS NOT NULL THEN
   INSERT INTO operations.account_notice(recipient_account_id,event_id,kind,journey_id)
   SELECT m.account_id,audit,'lifecycle',j FROM journeys.membership m WHERE m.journey_id=j AND m.account_id<>a AND (
     kind IN ('journey.archive','journey.delete','membership.leave','membership.remove') AND (m.state='active' OR m.ended_at=now_at)
     OR rk='source_grant' AND m.state='active' AND (
       EXISTS(SELECT FROM journeys.member_capability c WHERE c.membership_id=m.id AND c.membership_epoch=m.epoch AND c.state='active' AND c.capability IN ('coauthor','publisher'))
       OR EXISTS(SELECT FROM sources.export_grant g JOIN sources.export_grant_asset b ON b.grant_id=g.id WHERE g.journey_id=j AND g.recipient_membership_id=m.id AND g.recipient_epoch=m.epoch AND g.state='active' AND g.expires_at>now_at AND b.source_grant_id=rid)
     )
   ) ON CONFLICT(event_id,recipient_account_id) DO NOTHING;
 END IF;
 IF restricted THEN
   INSERT INTO operations.lifecycle_operation(id,actor_account_id,command_id,action,resource_kind,resource_id,journey_id,target_account_id,target_membership_id,impact_digest,target_revision,policy_generation,status_receipt_hash,created_at,updated_at,receipt_hard_expires_at)
   VALUES(oper,a,cmd,kind,rk,rid,j,CASE WHEN rk='account' THEN a END,mid,coalesce(impact.impact_digest,d),rev,gen,CASE WHEN rk='account' THEN status_hash END,now_at,now_at,CASE WHEN rk='account' THEN now_at+interval '45 days' END);
   ev:=gen_random_uuid();
   body:=pg_catalog.jsonb_build_object('id',ev,'kind',kind,'resourceKind',rk,'resourceId',rid,'accountId',CASE WHEN rk IN ('avatar','account') THEN a END,'journeyId',j,'membershipId',mid,'sourceId',s,'sourceGrantId',CASE WHEN rk='source_grant' THEN rid END,'exportGrantId',CASE WHEN rk='export_grant' THEN rid END,'invitationId',CASE WHEN rk='invitation' THEN rid END,'transferId',CASE WHEN rk='transfer' THEN rid END,'generation',gen);
   INSERT INTO operations.restriction_event(id,operation_id,kind,account_id,journey_id,membership_id,source_id,source_grant_id,export_grant_id,invitation_id,transfer_id,policy_generation,integrity_sha256)
   VALUES(ev,oper,kind,CASE WHEN rk IN ('avatar','account') THEN a END,j,mid,s,CASE WHEN rk='source_grant' THEN rid END,CASE WHEN rk='export_grant' THEN rid END,CASE WHEN rk='invitation' THEN rid END,CASE WHEN rk='transfer' THEN rid END,gen,pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(body::text,'UTF8')),'hex'));
   INSERT INTO operations.restriction_delivery(event_id) VALUES(ev);
   RETURN pg_catalog.jsonb_build_object('resourceId',oper,'resourceKind','lifecycle_operation','revision',rev,'state','restriction_pending','replayed',false,'jobs',pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('type','restriction','eventId',ev))||CASE WHEN op IN ('account.delete','journey.delete') THEN pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('type','cleanup','eventId',oper)) ELSE '[]'::jsonb END);
 END IF;
 RETURN pg_catalog.jsonb_build_object('resourceId',rid,'resourceKind',rk,'revision',rev,'state','accepted','replayed',false,'jobs',CASE WHEN op='avatar.replace' THEN pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('type','avatar','eventId',rid)) ELSE '[]'::jsonb END);
END $$;

-- Workers receive only durable event IDs and resolve the trusted target in SQL.
CREATE FUNCTION operations.pending_restriction(e uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
 SELECT pg_catalog.jsonb_build_object('body',operations.restriction_body(r.id)::text,'sha256',r.integrity_sha256)
 FROM operations.restriction_event r JOIN operations.restriction_delivery d ON d.event_id=r.id WHERE r.id=e AND d.state='pending'
$$;
CREATE FUNCTION operations.confirm_restriction(e uuid, receipt text, seq bigint, checkpoint text, hash text, key text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE r operations.restriction_event; o operations.lifecycle_operation; now_at timestamptz; BEGIN
 SELECT * INTO r FROM operations.restriction_event WHERE id=e;
 IF NOT FOUND OR r.integrity_sha256 IS DISTINCT FROM hash THEN RAISE EXCEPTION 'Invalid journal receipt' USING ERRCODE='23514'; END IF;
 SELECT * INTO o FROM operations.lifecycle_operation WHERE id=r.operation_id FOR UPDATE;
 now_at:=greatest(pg_catalog.clock_timestamp(),o.updated_at);
 INSERT INTO operations.restriction_receipt(event_id,external_receipt,sequence,checkpoint_sha256,event_sha256,key_id) VALUES(e,receipt,seq,checkpoint,hash,key) ON CONFLICT(event_id) DO NOTHING;
 IF EXISTS(SELECT FROM operations.restriction_receipt WHERE event_id=e AND (sequence<>seq OR checkpoint_sha256<>checkpoint OR event_sha256<>hash OR key_id<>key OR external_receipt<>receipt)) THEN RAISE EXCEPTION 'Receipt conflict' USING ERRCODE='23514'; END IF;
 UPDATE operations.restriction_delivery SET state='confirmed',attempts=attempts+1,revision=revision+1,last_error_code=NULL WHERE event_id=e AND state='pending';
 IF NOT EXISTS(SELECT FROM operations.restriction_event ev LEFT JOIN operations.restriction_receipt rr ON rr.event_id=ev.id WHERE ev.operation_id=o.id AND rr.event_id IS NULL) AND o.recovery_state='pending' THEN
   UPDATE operations.lifecycle_operation SET recovery_state='confirmed',state=CASE WHEN state='complete' THEN 'complete' WHEN action IN ('avatar.delete','account.delete','journey.delete') AND processed_units=0 THEN 'processing' ELSE 'complete' END,revision=revision+1,updated_at=now_at,terminal_at=coalesce(terminal_at,CASE WHEN action NOT IN ('avatar.delete','account.delete','journey.delete') OR processed_units>0 THEN now_at END),terminal_available_until=CASE WHEN terminal_at IS NOT NULL THEN terminal_available_until WHEN status_receipt_hash IS NOT NULL AND receipt_hard_expires_at>now_at AND processed_units>0 THEN least(receipt_hard_expires_at,now_at+interval '7 days') END WHERE id=o.id;
   UPDATE operations.command_receipt SET result_state='restriction_complete' WHERE actor_account_id=o.actor_account_id AND command_id=o.command_id;
   INSERT INTO operations.audit_event(actor_kind,service_name,action,target_id,revision,policy_generation) VALUES('service','restriction_coordinator','restriction.confirm',o.id,o.revision+1,o.policy_generation);
 END IF;
END $$;
CREATE FUNCTION operations.restriction_failed(e uuid, code text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
BEGIN
 UPDATE operations.restriction_delivery SET attempts=attempts+1,revision=revision+1,last_error_code=code,next_attempt_at=pg_catalog.clock_timestamp()+interval '30 seconds' WHERE event_id=e AND state='pending';
END $$;
CREATE FUNCTION operations.restriction_status(e uuid, secret_hash text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
 SELECT pg_catalog.jsonb_build_object('operationId',id,'state',state,'recoveryState',recovery_state,'processedUnits',processed_units,'totalUnits',total_units,'revision',revision)
 FROM operations.lifecycle_operation WHERE id=e AND status_receipt_hash=secret_hash AND receipt_hard_expires_at>pg_catalog.clock_timestamp() AND (terminal_available_until IS NULL OR terminal_available_until>pg_catalog.clock_timestamp())
$$;
-- Atomic, bounded counters: callers cannot select the stored target hashes.
CREATE FUNCTION operations.consume_budget(op text, key text, scope text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE lim integer; secs integer; n integer; start_at timestamptz; BEGIN
 IF scope NOT IN ('account','ip','target','cooldown','journey') THEN RAISE EXCEPTION 'Unknown scope' USING ERRCODE='22023'; END IF;
 SELECT CASE op WHEN 'sign_in' THEN CASE WHEN scope='ip' THEN 30 ELSE 5 END WHEN 'register' THEN 5 WHEN 'auth_mail' THEN CASE scope WHEN 'ip' THEN 20 WHEN 'cooldown' THEN 1 ELSE 3 END WHEN 'invite_create' THEN CASE scope WHEN 'account' THEN 100 WHEN 'target' THEN 3 ELSE 20 END WHEN 'invite_resolve' THEN 30 WHEN 'policy_mutation' THEN 30 WHEN 'export' THEN 10 WHEN 'status_poll' THEN CASE WHEN scope='ip' THEN 120 ELSE 60 END END,
 CASE op WHEN 'sign_in' THEN 900 WHEN 'auth_mail' THEN CASE WHEN scope='cooldown' THEN 60 ELSE 3600 END WHEN 'register' THEN 3600 WHEN 'invite_create' THEN CASE WHEN scope='account' THEN 86400 ELSE 3600 END WHEN 'export' THEN 3600 WHEN 'status_poll' THEN 60 ELSE 600 END INTO lim,secs;
 IF lim IS NULL THEN RAISE EXCEPTION 'Unknown budget' USING ERRCODE='22023'; END IF;
 IF scope='cooldown' THEN
   IF op<>'auth_mail' THEN RAISE EXCEPTION 'Invalid cooldown' USING ERRCODE='22023'; END IF;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(op||key,1));
   IF EXISTS(SELECT FROM operations.abuse_counter WHERE operation=op AND key_hash=key AND window_started_at>pg_catalog.clock_timestamp()-interval '60 seconds') THEN RETURN false; END IF;
   start_at:=pg_catalog.clock_timestamp();
   INSERT INTO operations.abuse_counter(operation,key_hash,window_started_at,window_seconds,count,expires_at) VALUES(op,key,start_at,60,1,start_at+interval '60 seconds'+interval '24 hours');
   RETURN true;
 END IF;
 start_at:=pg_catalog.to_timestamp(floor(extract(epoch FROM pg_catalog.clock_timestamp())/secs)*secs);
 INSERT INTO operations.abuse_counter(operation,key_hash,window_started_at,window_seconds,count,expires_at) VALUES(op,key,start_at,secs,1,start_at+secs*interval '1 second'+interval '24 hours')
 ON CONFLICT(operation,key_hash,window_started_at) DO UPDATE SET count=least(operations.abuse_counter.count+1,lim+1) RETURNING count INTO n;
 RETURN n<=lim;
END $$;

-- All internal functions are private to the NOLOGIN owner. Only the named entry points
-- are executable by the corresponding runtime. Trigger helpers remain invoker functions.
CREATE FUNCTION operations.preview_impact(e uuid,action text,j uuid,target uuid,secret text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE a uuid; rev bigint; gen bigint; d text; now_at timestamptz:=pg_catalog.clock_timestamp(); BEGIN
 a:=operations.command_actor();
 IF action='delete_account' THEN
   IF j IS NOT NULL OR target<>a THEN RAISE EXCEPTION 'Invalid target' USING ERRCODE='42501'; END IF;
   SELECT revision,policy_generation INTO rev,gen FROM identity.account WHERE id=a;
 ELSIF action IN ('archive','delete_journey','leave','remove_member') THEN
   SELECT revision,policy_generation INTO rev,gen FROM journeys.journey WHERE id=j AND lifecycle<>'deleted' FOR UPDATE;
   IF NOT FOUND OR (action<>'leave' AND NOT operations.has_power(a,j,'administrator')) THEN RAISE EXCEPTION 'Impact unavailable' USING ERRCODE='42501'; END IF;
   IF action IN ('leave','remove_member') THEN
     SELECT revision INTO rev FROM journeys.membership WHERE id=target AND journey_id=j AND state='active' AND (action<>'leave' OR account_id=a) FOR UPDATE;
     IF NOT FOUND THEN RAISE EXCEPTION 'Membership unavailable' USING ERRCODE='42501'; END IF;
   ELSIF target<>j THEN RAISE EXCEPTION 'Invalid target' USING ERRCODE='42501'; END IF;
 ELSE RAISE EXCEPTION 'Unsupported impact' USING ERRCODE='22023'; END IF;
 d:=pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.jsonb_build_array(action,j,target,rev,gen)::text,'UTF8')),'hex');
 INSERT INTO operations.impact_preview(id,actor_account_id,secret_hash,action,journey_id,target_account_id,target_membership_id,target_revision,policy_generation,impact_digest,created_at,expires_at)
 VALUES(e,a,secret,action,j,CASE WHEN action='delete_account' THEN a END,CASE WHEN action IN ('leave','remove_member') THEN target END,rev,gen,d,now_at,now_at+interval '5 minutes');
 RETURN pg_catalog.jsonb_build_object('id',e,'revision',rev,'generation',gen,'digest',d);
END $$;
GRANT EXECUTE ON FUNCTION operations.preview_impact(uuid,text,uuid,uuid,text),operations.execute_command(uuid,text,jsonb),operations.restriction_status(uuid,text),operations.consume_budget(text,text,text) TO kairn_server;
GRANT EXECUTE ON FUNCTION operations.pending_restriction(uuid),operations.confirm_restriction(uuid,text,bigint,text,text,text),operations.restriction_failed(uuid,text) TO kairn_worker;
GRANT EXECUTE ON FUNCTION operations.consume_budget(text,text,text) TO kairn_auth;
GRANT CREATE ON SCHEMA operations TO kairn_command;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='operations' AND p.proname IN ('command_actor','has_power','collaboration_open','restriction_body','execute_command','pending_restriction','confirm_restriction','restriction_failed','restriction_status','consume_budget','preview_impact') LOOP
   EXECUTE pg_catalog.format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f.sig);
   EXECUTE pg_catalog.format('ALTER FUNCTION %s OWNER TO kairn_command',f.sig);
 END LOOP;
END $$;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
