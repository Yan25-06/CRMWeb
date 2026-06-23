-- =========================================================================
-- Migration: Allow admin to update any teacher row
--
-- Root cause: "teachers: self update" policy (id = auth.uid()) only lets
-- a teacher update their own row. Admin has no UPDATE policy on teachers,
-- so setting monthly_salary for other teachers was silently blocked by RLS.
--
-- The prevent_salary_change trigger still blocks non-admin salary changes.
-- The prevent_is_admin_change trigger still blocks is_admin changes via API.
--
-- Rollback:
--   drop policy if exists "teachers: admin update" on public.teachers;
-- =========================================================================

create policy "teachers: admin update"
  on public.teachers for update
  using    (is_admin())
  with check (is_admin());
