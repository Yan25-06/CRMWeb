-- =========================================================================
-- Migration: Restrict teacher write access on students and mock_tests
-- Change: restrict-teacher-readonly-students
--
-- Teachers lose INSERT/UPDATE/DELETE on `students` and `mock_tests`.
-- They keep SELECT (read-only). Admin write policies are independent
-- (is_admin()) and remain unchanged. `mock_test_results` and all other
-- business tables keep teacher write access.
--
-- Rollback: re-create the 6 dropped policies with their original
-- definitions from 20260602000001_enable_rls_policies.sql:
--   students: teacher insert / update / delete
--   mock_tests: teacher insert / update / delete
-- =========================================================================

-- -------------------------------------------------------------------------
-- students: drop teacher write policies (keep SELECT)
-- -------------------------------------------------------------------------
drop policy if exists "students: teacher insert" on public.students;
drop policy if exists "students: teacher update" on public.students;
drop policy if exists "students: teacher delete" on public.students;

-- -------------------------------------------------------------------------
-- mock_tests: drop teacher write policies (keep SELECT)
-- -------------------------------------------------------------------------
drop policy if exists "mock_tests: teacher insert" on public.mock_tests;
drop policy if exists "mock_tests: teacher update" on public.mock_tests;
drop policy if exists "mock_tests: teacher delete" on public.mock_tests;
