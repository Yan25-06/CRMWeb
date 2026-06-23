-- =========================================================================
-- Migration: Teacher salary + substitute teacher (lương giáo viên & dạy thay)
-- Change: add-teacher-payroll
--
-- - teachers.monthly_salary: lương tháng cố định (admin set).
-- - teacher_attendance.substitute_teacher_id: giáo viên dạy thay khi status='absent'.
-- - Mở rộng policy SELECT của teacher_attendance để GV dạy thay đọc được buổi
--   mình dạy thay (record đó thuộc người vắng).
--
-- Rollback:
--   alter table public.teachers drop column monthly_salary;
--   alter table public.teacher_attendance drop column substitute_teacher_id;
--   (khôi phục policy SELECT cũ chỉ teacher_id = auth.uid() or is_admin())
-- =========================================================================

alter table public.teachers
  add column if not exists monthly_salary numeric;

alter table public.teacher_attendance
  add column if not exists substitute_teacher_id uuid references public.teachers(id);

-- Mở rộng policy SELECT: cho phép giáo viên dạy thay đọc record.
drop policy if exists "teacher_attendance: teacher or admin select" on public.teacher_attendance;
create policy "teacher_attendance: teacher or admin select"
  on public.teacher_attendance for select
  using (
    teacher_id = auth.uid()
    or substitute_teacher_id = auth.uid()
    or is_admin()
  );
