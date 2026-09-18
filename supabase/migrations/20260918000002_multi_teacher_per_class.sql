-- =========================================================================
-- Migration: Nhiều giáo viên trong một lớp, chia theo ca
-- Change: multi-teacher-per-class
--
-- Một lớp có thể chia buổi giữa nhiều giáo viên (T2 cô A, T4 cô B). Mỗi ca
-- trong bảng `schedule` thuộc về ĐÚNG MỘT giáo viên.
--
--   schedule.teacher_id = null  → GV phụ trách lớp (classes.teacher_id) dạy ca đó
--   schedule.teacher_id = <uid> → giáo viên đó dạy ca đó
--
-- Quyền truy cập lớp vì vậy không còn là `classes.teacher_id = auth.uid()` mà
-- là `can_access_class(class_id)`: GV phụ trách HOẶC có ít nhất một ca trong lớp.
--
-- Rollback:
--   drop toàn bộ policy tạo ở đây, re-create bản cũ (nội dung gốc ở
--   20260602000001, 20260604000001, 20260625000001, 20260625000002, 20260710000001), rồi:
--   drop function if exists public.can_access_class(uuid);
--   alter table public.schedule drop column if exists teacher_id;
-- =========================================================================

alter table public.schedule
  add column if not exists teacher_id uuid references public.teachers(id) on delete set null;

comment on column public.schedule.teacher_id is
  'Giáo viên dạy ca này. NULL = giáo viên phụ trách lớp (classes.teacher_id).';

create index if not exists schedule_teacher_id_idx on public.schedule (teacher_id);

-- -------------------------------------------------------------------------
-- Helper: một giáo viên truy cập được lớp nếu phụ trách lớp hoặc có ca trong lớp.
-- -------------------------------------------------------------------------
create or replace function public.can_access_class(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.classes c
        where c.id = cid and c.teacher_id = auth.uid()
      )
      or exists (
        select 1 from public.schedule s
        where s.class_id = cid and s.teacher_id = auth.uid()
      );
$$;

grant execute on function public.can_access_class(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- classes — SELECT mở cho GV có ca trong lớp. Write vẫn chỉ admin + GV phụ trách.
-- -------------------------------------------------------------------------
drop policy if exists "classes: teacher or admin select" on public.classes;
create policy "classes: teacher or admin select"
  on public.classes for select
  using (can_access_class(id));

-- -------------------------------------------------------------------------
-- Bảng con khóa theo class_id: enrollments, sessions, hw_assignments,
-- reviews, session_reviews, general_comments.
-- -------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'enrollments', 'sessions', 'hw_assignments',
    'reviews', 'session_reviews', 'general_comments'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || ': teacher or admin select', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher insert', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher update', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher delete', t);

    execute format(
      'create policy %I on public.%I for select using (can_access_class(class_id))',
      t || ': teacher or admin select', t);
    execute format(
      'create policy %I on public.%I for insert with check (can_access_class(class_id))',
      t || ': teacher insert', t);
    execute format(
      'create policy %I on public.%I for update using (can_access_class(class_id)) with check (can_access_class(class_id))',
      t || ': teacher update', t);
    execute format(
      'create policy %I on public.%I for delete using (can_access_class(class_id))',
      t || ': teacher delete', t);
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- attendance & homeworks (qua sessions.class_id)
-- -------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['attendance', 'homeworks']
  loop
    execute format('drop policy if exists %I on public.%I', t || ': teacher or admin select', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher insert', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher update', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher delete', t);

    execute format(
      'create policy %I on public.%I for select using (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher or admin select', t);
    execute format(
      'create policy %I on public.%I for insert with check (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher insert', t);
    execute format(
      'create policy %I on public.%I for update using (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id))) with check (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher update', t);
    execute format(
      'create policy %I on public.%I for delete using (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher delete', t);
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- submissions (qua hw_assignments.class_id)
-- -------------------------------------------------------------------------
drop policy if exists "submissions: teacher or admin select" on public.submissions;
drop policy if exists "submissions: teacher insert" on public.submissions;
drop policy if exists "submissions: teacher update" on public.submissions;
drop policy if exists "submissions: teacher delete" on public.submissions;

create policy "submissions: teacher or admin select"
  on public.submissions for select
  using (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

create policy "submissions: teacher insert"
  on public.submissions for insert
  with check (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

create policy "submissions: teacher update"
  on public.submissions for update
  using      (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)))
  with check (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

create policy "submissions: teacher delete"
  on public.submissions for delete
  using (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

-- -------------------------------------------------------------------------
-- mock_test_results (qua mock_tests.class_id)
-- -------------------------------------------------------------------------
drop policy if exists "mock_test_results: teacher or admin select" on public.mock_test_results;
drop policy if exists "mock_test_results: teacher insert" on public.mock_test_results;
drop policy if exists "mock_test_results: teacher update" on public.mock_test_results;
drop policy if exists "mock_test_results: teacher delete" on public.mock_test_results;

create policy "mock_test_results: teacher or admin select"
  on public.mock_test_results for select
  using (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

create policy "mock_test_results: teacher insert"
  on public.mock_test_results for insert
  with check (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

create policy "mock_test_results: teacher update"
  on public.mock_test_results for update
  using      (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)))
  with check (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

create policy "mock_test_results: teacher delete"
  on public.mock_test_results for delete
  using (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

-- -------------------------------------------------------------------------
-- students — GV đọc được học sinh trong lớp mình dạy (kể cả lớp chia ca).
-- -------------------------------------------------------------------------
drop policy if exists "students: teacher or admin select" on public.students;
create policy "students: teacher or admin select"
  on public.students for select
  using (
    teacher_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.student_id = students.id and can_access_class(e.class_id)
    )
  );

-- -------------------------------------------------------------------------
-- schedule — GV đọc ca của lớp mình truy cập được; ghi chỉ admin (lịch được
-- sinh tự động từ ClassModal, vốn là màn hình admin).
--
-- Lưu ý: "schedule: admin insert/update/delete" đã tồn tại từ migration
-- 20260604000001_admin_full_write_access.sql (using is_admin()) — drop trước
-- khi tạo lại (cùng tên, cùng nội dung) để tránh lỗi "policy already exists".
-- -------------------------------------------------------------------------
drop policy if exists "schedule: teacher or admin select" on public.schedule;
drop policy if exists "schedule: teacher insert" on public.schedule;
drop policy if exists "schedule: teacher update" on public.schedule;
drop policy if exists "schedule: teacher delete" on public.schedule;
drop policy if exists "schedule: admin insert" on public.schedule;
drop policy if exists "schedule: admin update" on public.schedule;
drop policy if exists "schedule: admin delete" on public.schedule;

create policy "schedule: teacher or admin select"
  on public.schedule for select
  using (teacher_id = auth.uid() or can_access_class(class_id));

create policy "schedule: admin insert"
  on public.schedule for insert
  with check (is_admin());

create policy "schedule: admin update"
  on public.schedule for update
  using (is_admin()) with check (is_admin());

create policy "schedule: admin delete"
  on public.schedule for delete
  using (is_admin());

-- -------------------------------------------------------------------------
-- teacher_attendance — GV tự chấm công ca CỦA MÌNH (theo schedule.teacher_id,
-- fallback classes.teacher_id khi ca chưa gán GV riêng).
-- -------------------------------------------------------------------------
drop policy if exists "teacher_attendance: teacher self insert" on public.teacher_attendance;
create policy "teacher_attendance: teacher self insert"
  on public.teacher_attendance for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.schedule s
      join public.classes c on c.id = s.class_id
      where s.id = schedule_id
        and coalesce(s.teacher_id, c.teacher_id) = auth.uid()
    )
  );

-- Các policy "teacher_attendance: teacher self update/delete" và
-- "teacher_attendance: substitute confirm update" khóa theo teacher_id =
-- auth.uid() / substitute_teacher_id = auth.uid() — không phụ thuộc lớp nên
-- giữ nguyên, không đụng tới.
