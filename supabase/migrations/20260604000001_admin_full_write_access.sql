-- =========================================================================
-- Migration: Admin full write access on all business tables
-- Change: redesign-admin-permissions
--
-- Admin used to be read-only (only `classes` had admin write policies).
-- The center owner also teaches like a regular teacher, so admin now gets
-- INSERT/UPDATE/DELETE on every business table, NOT limited by teacher_id.
--
-- Approach: add INDEPENDENT admin policies (condition is_admin()) alongside
-- the existing teacher policies. Postgres OR-combines permissive policies,
-- so the teacher policies are left completely untouched. Rollback = drop
-- only the policies created here.
--
-- `classes` already has admin write policies (the original sole exception)
-- → intentionally NOT included here.
-- `teachers` keeps its own self-update rule + is_admin trigger → excluded.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. students, enrollments, sessions, attendance, schedule
-- -------------------------------------------------------------------------
create policy "students: admin insert"
  on public.students for insert with check (is_admin());
create policy "students: admin update"
  on public.students for update using (is_admin()) with check (is_admin());
create policy "students: admin delete"
  on public.students for delete using (is_admin());

create policy "enrollments: admin insert"
  on public.enrollments for insert with check (is_admin());
create policy "enrollments: admin update"
  on public.enrollments for update using (is_admin()) with check (is_admin());
create policy "enrollments: admin delete"
  on public.enrollments for delete using (is_admin());

create policy "sessions: admin insert"
  on public.sessions for insert with check (is_admin());
create policy "sessions: admin update"
  on public.sessions for update using (is_admin()) with check (is_admin());
create policy "sessions: admin delete"
  on public.sessions for delete using (is_admin());

create policy "attendance: admin insert"
  on public.attendance for insert with check (is_admin());
create policy "attendance: admin update"
  on public.attendance for update using (is_admin()) with check (is_admin());
create policy "attendance: admin delete"
  on public.attendance for delete using (is_admin());

create policy "schedule: admin insert"
  on public.schedule for insert with check (is_admin());
create policy "schedule: admin update"
  on public.schedule for update using (is_admin()) with check (is_admin());
create policy "schedule: admin delete"
  on public.schedule for delete using (is_admin());

-- -------------------------------------------------------------------------
-- 2. homeworks, hw_assignments, submissions, fees, payments
-- -------------------------------------------------------------------------
create policy "homeworks: admin insert"
  on public.homeworks for insert with check (is_admin());
create policy "homeworks: admin update"
  on public.homeworks for update using (is_admin()) with check (is_admin());
create policy "homeworks: admin delete"
  on public.homeworks for delete using (is_admin());

create policy "hw_assignments: admin insert"
  on public.hw_assignments for insert with check (is_admin());
create policy "hw_assignments: admin update"
  on public.hw_assignments for update using (is_admin()) with check (is_admin());
create policy "hw_assignments: admin delete"
  on public.hw_assignments for delete using (is_admin());

create policy "submissions: admin insert"
  on public.submissions for insert with check (is_admin());
create policy "submissions: admin update"
  on public.submissions for update using (is_admin()) with check (is_admin());
create policy "submissions: admin delete"
  on public.submissions for delete using (is_admin());

create policy "fees: admin insert"
  on public.fees for insert with check (is_admin());
create policy "fees: admin update"
  on public.fees for update using (is_admin()) with check (is_admin());
create policy "fees: admin delete"
  on public.fees for delete using (is_admin());

create policy "payments: admin insert"
  on public.payments for insert with check (is_admin());
create policy "payments: admin update"
  on public.payments for update using (is_admin()) with check (is_admin());
create policy "payments: admin delete"
  on public.payments for delete using (is_admin());

-- -------------------------------------------------------------------------
-- 3. reviews, session_reviews, general_comments, mock_tests,
--    mock_test_results, settings
-- -------------------------------------------------------------------------
create policy "reviews: admin insert"
  on public.reviews for insert with check (is_admin());
create policy "reviews: admin update"
  on public.reviews for update using (is_admin()) with check (is_admin());
create policy "reviews: admin delete"
  on public.reviews for delete using (is_admin());

create policy "session_reviews: admin insert"
  on public.session_reviews for insert with check (is_admin());
create policy "session_reviews: admin update"
  on public.session_reviews for update using (is_admin()) with check (is_admin());
create policy "session_reviews: admin delete"
  on public.session_reviews for delete using (is_admin());

create policy "general_comments: admin insert"
  on public.general_comments for insert with check (is_admin());
create policy "general_comments: admin update"
  on public.general_comments for update using (is_admin()) with check (is_admin());
create policy "general_comments: admin delete"
  on public.general_comments for delete using (is_admin());

create policy "mock_tests: admin insert"
  on public.mock_tests for insert with check (is_admin());
create policy "mock_tests: admin update"
  on public.mock_tests for update using (is_admin()) with check (is_admin());
create policy "mock_tests: admin delete"
  on public.mock_tests for delete using (is_admin());

create policy "mock_test_results: admin insert"
  on public.mock_test_results for insert with check (is_admin());
create policy "mock_test_results: admin update"
  on public.mock_test_results for update using (is_admin()) with check (is_admin());
create policy "mock_test_results: admin delete"
  on public.mock_test_results for delete using (is_admin());

create policy "settings: admin insert"
  on public.settings for insert with check (is_admin());
create policy "settings: admin update"
  on public.settings for update using (is_admin()) with check (is_admin());
create policy "settings: admin delete"
  on public.settings for delete using (is_admin());
