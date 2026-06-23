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
--   drop policy "teacher_attendance: teacher or admin select" on public.teacher_attendance;
--   create policy "teacher_attendance: teacher or admin select"
--     on public.teacher_attendance for select
--     using (teacher_id = auth.uid() or is_admin());
--   drop trigger if exists trg_prevent_salary_change on public.teachers;
--   drop function if exists public.prevent_salary_change();
-- =========================================================================

alter table public.teachers
  add column if not exists monthly_salary numeric;

alter table public.teacher_attendance
  add column if not exists substitute_teacher_id uuid references public.teachers(id);

-- Bảo vệ monthly_salary: chỉ admin mới được đổi lương.
create or replace function public.prevent_salary_change()
  returns trigger language plpgsql security definer as $$
begin
  if new.monthly_salary is distinct from old.monthly_salary then
    if not is_admin() then
      raise exception 'permission denied: monthly_salary can only be changed by admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_salary_change on public.teachers;
create trigger trg_prevent_salary_change
  before update on public.teachers
  for each row execute function public.prevent_salary_change();

-- Mở rộng policy SELECT: cho phép giáo viên dạy thay đọc record.
drop policy if exists "teacher_attendance: teacher or admin select" on public.teacher_attendance;
create policy "teacher_attendance: teacher or admin select"
  on public.teacher_attendance for select
  using (
    teacher_id = auth.uid()
    or substitute_teacher_id = auth.uid()
    or is_admin()
  );
