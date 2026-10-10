-- JengaPact — database creation helper.
--
-- Creates the application role and database if they do not already exist.
-- Run with an administrative connection, e.g.:
--   set PGPASSWORD=<superuser password>
--   "/c/Program Files/PostgreSQL/18/bin/psql" -U postgres -h localhost -f scripts/create-database.sql
--
-- The role is NOT granted superuser: the application must not be able to drop
-- schemas or read other databases.
--
-- NOTE (local development): the local development role on this machine cannot
-- CREATE DATABASE, so the app currently runs inside a dedicated `jengapact`
-- SCHEMA of the existing `sokobuild` database. Application tables are still
-- fully isolated and schema-qualified; nothing in JengaPact references a table
-- outside its own schema. For a dedicated database, run this script.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'jengapact') THEN
    CREATE ROLE jengapact WITH LOGIN PASSWORD 'jengapact_local_dev';
  END IF;
END
$$;

SELECT 'role jengapact ready' AS status;

SELECT 'CREATE DATABASE jengapact OWNER jengapact ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'jengapact')
\gexec