-- =========================================================
-- Migration 003: GRANT privileges + fixes
-- Run AFTER 001 and 002.
--
-- Why: tables created via raw SQL don't always grant table
-- privileges to the `authenticated` role. RLS alone is not
-- enough — Postgres first checks table-level GRANT, then RLS.
-- Missing GRANT → 403 "permission denied" even on SELECT.
-- =========================================================

-- ── Schema usage ─────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- ── Table privileges for the logged-in (authenticated) role ──
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ── Let the admin-check helper run for authenticated users ──
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ── Future tables/sequences get the same grants automatically ──
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
