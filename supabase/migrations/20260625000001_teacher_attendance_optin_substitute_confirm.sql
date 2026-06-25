-- =========================================================================
-- Migration: Chấm công opt-in + xác nhận dạy thay
-- Change: teacher-attendance-optin-substitute-confirm
--
-- - teacher_attendance.substitute_confirmed: GV dạy thay xác nhận đã dạy.
-- - RLS: cho phép GV tự chấm công (insert/update/delete) record của lớp mình
--   phụ trách; cho phép GV dạy thay update record được giao.
-- - Mô hình opt-in: KHÔNG có record = "chưa xác nhận" (không tính lương);
--   status='present' = đã dạy (tính lương); status='absent' = vắng.
--
-- Rollback:
--   drop policy if exists "teacher_attendance: teacher self insert" on public.teacher_attendance;
--   drop policy if exists "teacher_attendance: teacher self update" on public.teacher_attendance;
--   drop policy if exists "teacher_attendance: teacher self delete" on public.teacher_attendance;
--   drop policy if exists "teacher_attendance: substitute confirm update" on public.teacher_attendance;
--   alter table public.teacher_attendance drop column if exists substitute_confirmed;
-- =========================================================================

alter table public.teacher_attendance
  add column if not exists substitute_confirmed boolean not null default false;

-- GV tự chấm công cho buổi thuộc lớp mình phụ trách.
create policy "teacher_attendance: teacher self insert"
  on public.teacher_attendance for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.schedule s
      join public.classes c on c.id = s.class_id
      where s.id = schedule_id and c.teacher_id = auth.uid()
    )
  );

create policy "teacher_attendance: teacher self update"
  on public.teacher_attendance for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "teacher_attendance: teacher self delete"
  on public.teacher_attendance for delete
  using (teacher_id = auth.uid());

-- GV dạy thay cập nhật record được giao (giữ vai trò substitute của chính mình).
create policy "teacher_attendance: substitute confirm update"
  on public.teacher_attendance for update
  using (substitute_teacher_id = auth.uid())
  with check (substitute_teacher_id = auth.uid());
