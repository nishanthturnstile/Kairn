-- Count failed sign-ins while reserving capacity for concurrent in-flight attempts.
-- Successful requests release only their own reservation in its original window.
CREATE FUNCTION operations.reserve_auth_attempt(key text, scope text) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE start_at timestamptz; lim integer; n integer;
BEGIN
 IF key !~ '^[a-f0-9]{64}$' OR scope NOT IN ('account','ip') THEN RAISE EXCEPTION 'Invalid auth budget' USING ERRCODE='22023'; END IF;
 lim:=CASE WHEN scope='ip' THEN 30 ELSE 5 END;
 start_at:=pg_catalog.to_timestamp(floor(extract(epoch FROM pg_catalog.clock_timestamp())/900)*900);
 INSERT INTO operations.abuse_counter(operation,key_hash,window_started_at,window_seconds,count,expires_at)
 VALUES('sign_in',key,start_at,900,1,start_at+interval '24 hours 15 minutes')
 ON CONFLICT(operation,key_hash,window_started_at) DO UPDATE SET count=operations.abuse_counter.count+1 WHERE operations.abuse_counter.count<lim RETURNING count INTO n;
 IF n IS NULL THEN RETURN NULL; END IF;
 RETURN start_at;
END $$;
CREATE FUNCTION operations.release_auth_attempt(key text, reserved_at timestamptz) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET row_security=on AS $$
DECLARE n integer;
BEGIN
 IF key !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid auth budget' USING ERRCODE='22023'; END IF;
 SELECT count INTO n FROM operations.abuse_counter WHERE operation='sign_in' AND key_hash=key AND window_started_at=reserved_at FOR UPDATE;
 IF n=1 THEN DELETE FROM operations.abuse_counter WHERE operation='sign_in' AND key_hash=key AND window_started_at=reserved_at;
 ELSIF n>1 THEN UPDATE operations.abuse_counter SET count=count-1 WHERE operation='sign_in' AND key_hash=key AND window_started_at=reserved_at; END IF;
END $$;
REVOKE ALL ON FUNCTION operations.reserve_auth_attempt(text,text),operations.release_auth_attempt(text,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION operations.reserve_auth_attempt(text,text),operations.release_auth_attempt(text,timestamptz) TO kairn_auth;
GRANT CREATE ON SCHEMA operations TO kairn_command;
ALTER FUNCTION operations.reserve_auth_attempt(text,text) OWNER TO kairn_command;
ALTER FUNCTION operations.release_auth_attempt(text,timestamptz) OWNER TO kairn_command;
REVOKE CREATE ON SCHEMA operations FROM kairn_command;
