-- Executed only by the official image on a new volume. Passwords come from Compose.
\getenv migrator_password KAIRN_MIGRATOR_PASSWORD
\getenv server_password KAIRN_SERVER_DB_PASSWORD
\getenv worker_password KAIRN_WORKER_DB_PASSWORD
CREATE ROLE kairn_migrator LOGIN PASSWORD :'migrator_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE kairn_server LOGIN PASSWORD :'server_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE ROLE kairn_worker LOGIN PASSWORD :'worker_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
REVOKE ALL ON DATABASE kairn FROM PUBLIC;
GRANT CONNECT ON DATABASE kairn TO kairn_migrator, kairn_server, kairn_worker;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA pgboss AUTHORIZATION kairn_migrator;
\ir /etc/kairn-postgres/identity-principals.sql
