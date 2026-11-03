-- Controlled operator/bootstrap input, never executed with API or worker credentials.
-- Re-runnable upgrade for the existing queue-only database; does not replace existing passwords.
\getenv auth_password KAIRN_AUTH_DB_PASSWORD
SELECT 'CREATE ROLE kairn_auth LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS'
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kairn_auth') \gexec
SELECT 'CREATE ROLE kairn_identity NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS'
WHERE NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kairn_identity') \gexec
-- Explicit local/auth credential rotation is operator-owned; other roles/signing files are untouched.
ALTER ROLE kairn_auth PASSWORD :'auth_password';
ALTER ROLE kairn_auth SET timezone TO 'UTC';
GRANT CONNECT ON DATABASE kairn TO kairn_auth;
GRANT CREATE ON DATABASE kairn TO kairn_migrator;
GRANT kairn_identity TO kairn_migrator WITH INHERIT FALSE, SET TRUE;
-- Declaring a custom function SET value requires parameter permission even though ordinary
-- transaction-local set_config is available. Keep the grant on these controlled principals.
GRANT SET ON PARAMETER "kairn.verified_auth_subject" TO kairn_migrator, kairn_identity;
