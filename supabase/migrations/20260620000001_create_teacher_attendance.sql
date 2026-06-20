-- =========================================================================
-- Migration: Teacher attendance (chấm công giáo viên)
-- Change: add-teacher-attendance
--
-- Admin chấm công giáo viên theo từng ca lịch cố định (schedule) trên một
-- ngày cụ thể. Mỗi (schedule_id, date) chỉ có 1 record (unique).
--
-- RLS: admin full write (is_admin()); teacher chỉ SELECT record của mình.
-- Rollback = drop table (cascade tự dọn policy).
-- =========================================================================

create table public.teacher_attendance (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.schedule(id) on delete cascade,
  date         date not null,
  teacher_id   uuid not null references public.teachers(id),
  status       text not null check (status in ('present', 'absent', 'makeup')),
  note         text,
  created_at   timestamptz not null default now(),
  unique (schedule_id, date)
);

alter table public.teacher_attendance enable row level security;

-- Teacher: chỉ đọc record chấm công của chính mình.
create policy "teacher_attendance: teacher or admin select"
  on public.teacher_attendance for select
  using (teacher_id = auth.uid() or is_admin());

-- Admin: toàn quyền ghi.
create policy "teacher_attendance: admin insert"
  on public.teacher_attendance for insert with check (is_admin());
create policy "teacher_attendance: admin update"
  on public.teacher_attendance for update using (is_admin()) with check (is_admin());
create policy "teacher_attendance: admin delete"
  on public.teacher_attendance for delete using (is_admin());
