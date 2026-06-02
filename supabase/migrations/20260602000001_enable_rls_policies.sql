-- =========================================================================
-- Migration: Enable Row Level Security on all tables
-- Change: add-rls-policies
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Helper: is_admin()
-- SECURITY DEFINER so it reads teachers.is_admin without triggering RLS
-- on teachers itself (avoids infinite recursion in policies).
-- -------------------------------------------------------------------------
create or replace function public.is_admin()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select coalesce(
    (select is_admin from public.teachers where id = auth.uid()),
    false
  );
$$;

-- -------------------------------------------------------------------------
-- 2. teachers
-- -------------------------------------------------------------------------
alter table public.teachers enable row level security;

-- Each authenticated user reads their own row; admin reads all.
create policy "teachers: self read or admin"
  on public.teachers for select
  using (id = auth.uid() or is_admin());

-- Each user updates only their own profile row.
-- WITH CHECK keeps the same id, preventing row hi-jacking.
create policy "teachers: self update"
  on public.teachers for update
  using    (id = auth.uid())
  with check (id = auth.uid());

-- Trigger: block any change to is_admin coming through the API.
-- Direct database access (Dashboard SQL Editor / psql) has no JWT claims
-- and is allowed to change is_admin for admin bootstrap.
create or replace function public.prevent_is_admin_change()
  returns trigger
  language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    -- request.jwt.claims is only set when the request comes through PostgREST.
    -- Raw SQL (Dashboard, psql) has no claims → allowed for bootstrap.
    if current_setting('request.jwt.claims', true) is not null
       and current_setting('request.jwt.claims', true) <> ''
    then
      raise exception 'permission denied: is_admin cannot be changed via the API';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_is_admin_change
  before update on public.teachers
  for each row
  execute function public.prevent_is_admin_change();

-- -------------------------------------------------------------------------
-- 3. students  (root table — teacher_id is the ownership column)
-- -------------------------------------------------------------------------
alter table public.students enable row level security;

create policy "students: teacher or admin select"
  on public.students for select
  using (teacher_id = auth.uid() or is_admin());

create policy "students: teacher insert"
  on public.students for insert
  with check (teacher_id = auth.uid());

create policy "students: teacher update"
  on public.students for update
  using    (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "students: teacher delete"
  on public.students for delete
  using (teacher_id = auth.uid());

-- -------------------------------------------------------------------------
-- 4. classes  (root table — teacher_id is the ownership column)
--
-- Business rule: admin creates classes and assigns them to teachers.
-- Teachers can only update the content of their own assigned classes;
-- they cannot create, delete, or reassign classes.
--
-- WARNING: Admin write policies on classes are the ONLY admin write
-- exception in the entire schema. Do NOT copy this pattern to other tables.
-- -------------------------------------------------------------------------
alter table public.classes enable row level security;

create policy "classes: teacher or admin select"
  on public.classes for select
  using (teacher_id = auth.uid() or is_admin());

-- Teacher can update content fields of their own class.
-- WITH CHECK (teacher_id = auth.uid()) prevents the teacher from
-- reassigning teacher_id to another teacher.
create policy "classes: teacher update"
  on public.classes for update
  using    (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- EXCEPTION — admin write: create, reassign, and remove classes.
-- WARNING: sole admin write exception; do not extend to other tables.
create policy "classes: admin insert"
  on public.classes for insert
  with check (is_admin());

create policy "classes: admin update"
  on public.classes for update
  using    (is_admin())
  with check (is_admin());

create policy "classes: admin delete"
  on public.classes for delete
  using (is_admin());

-- -------------------------------------------------------------------------
-- 5. enrollments  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.enrollments enable row level security;

create policy "enrollments: teacher or admin select"
  on public.enrollments for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "enrollments: teacher insert"
  on public.enrollments for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "enrollments: teacher update"
  on public.enrollments for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "enrollments: teacher delete"
  on public.enrollments for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 6. sessions  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.sessions enable row level security;

create policy "sessions: teacher or admin select"
  on public.sessions for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "sessions: teacher insert"
  on public.sessions for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "sessions: teacher update"
  on public.sessions for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "sessions: teacher delete"
  on public.sessions for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 7. attendance  (child: student_id → students.teacher_id)
-- -------------------------------------------------------------------------
alter table public.attendance enable row level security;

create policy "attendance: teacher or admin select"
  on public.attendance for select
  using (
    is_admin() or
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "attendance: teacher insert"
  on public.attendance for insert
  with check (
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "attendance: teacher update"
  on public.attendance for update
  using    (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

create policy "attendance: teacher delete"
  on public.attendance for delete
  using (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 8. schedule  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.schedule enable row level security;

create policy "schedule: teacher or admin select"
  on public.schedule for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "schedule: teacher insert"
  on public.schedule for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "schedule: teacher update"
  on public.schedule for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "schedule: teacher delete"
  on public.schedule for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 9. homeworks  (child: student_id → students.teacher_id)
-- -------------------------------------------------------------------------
alter table public.homeworks enable row level security;

create policy "homeworks: teacher or admin select"
  on public.homeworks for select
  using (
    is_admin() or
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "homeworks: teacher insert"
  on public.homeworks for insert
  with check (
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "homeworks: teacher update"
  on public.homeworks for update
  using    (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

create policy "homeworks: teacher delete"
  on public.homeworks for delete
  using (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 10. hw_assignments  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.hw_assignments enable row level security;

create policy "hw_assignments: teacher or admin select"
  on public.hw_assignments for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "hw_assignments: teacher insert"
  on public.hw_assignments for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "hw_assignments: teacher update"
  on public.hw_assignments for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "hw_assignments: teacher delete"
  on public.hw_assignments for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 11. submissions  (child: student_id → students.teacher_id)
-- -------------------------------------------------------------------------
alter table public.submissions enable row level security;

create policy "submissions: teacher or admin select"
  on public.submissions for select
  using (
    is_admin() or
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "submissions: teacher insert"
  on public.submissions for insert
  with check (
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "submissions: teacher update"
  on public.submissions for update
  using    (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

create policy "submissions: teacher delete"
  on public.submissions for delete
  using (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 12. fees  (child: student_id → students.teacher_id)
-- -------------------------------------------------------------------------
alter table public.fees enable row level security;

create policy "fees: teacher or admin select"
  on public.fees for select
  using (
    is_admin() or
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "fees: teacher insert"
  on public.fees for insert
  with check (
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "fees: teacher update"
  on public.fees for update
  using    (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

create policy "fees: teacher delete"
  on public.fees for delete
  using (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 13. payments  (child: student_id → students.teacher_id)
-- -------------------------------------------------------------------------
alter table public.payments enable row level security;

create policy "payments: teacher or admin select"
  on public.payments for select
  using (
    is_admin() or
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "payments: teacher insert"
  on public.payments for insert
  with check (
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "payments: teacher update"
  on public.payments for update
  using    (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

create policy "payments: teacher delete"
  on public.payments for delete
  using (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 14. reviews  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.reviews enable row level security;

create policy "reviews: teacher or admin select"
  on public.reviews for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "reviews: teacher insert"
  on public.reviews for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "reviews: teacher update"
  on public.reviews for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "reviews: teacher delete"
  on public.reviews for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 15. session_reviews  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.session_reviews enable row level security;

create policy "session_reviews: teacher or admin select"
  on public.session_reviews for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "session_reviews: teacher insert"
  on public.session_reviews for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "session_reviews: teacher update"
  on public.session_reviews for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "session_reviews: teacher delete"
  on public.session_reviews for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 16. general_comments  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.general_comments enable row level security;

create policy "general_comments: teacher or admin select"
  on public.general_comments for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "general_comments: teacher insert"
  on public.general_comments for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "general_comments: teacher update"
  on public.general_comments for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "general_comments: teacher delete"
  on public.general_comments for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 17. mock_tests  (child: class_id → classes.teacher_id)
-- -------------------------------------------------------------------------
alter table public.mock_tests enable row level security;

create policy "mock_tests: teacher or admin select"
  on public.mock_tests for select
  using (
    is_admin() or
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "mock_tests: teacher insert"
  on public.mock_tests for insert
  with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
  );

create policy "mock_tests: teacher update"
  on public.mock_tests for update
  using    (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

create policy "mock_tests: teacher delete"
  on public.mock_tests for delete
  using (exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 18. mock_test_results  (child: student_id → students.teacher_id)
-- -------------------------------------------------------------------------
alter table public.mock_test_results enable row level security;

create policy "mock_test_results: teacher or admin select"
  on public.mock_test_results for select
  using (
    is_admin() or
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "mock_test_results: teacher insert"
  on public.mock_test_results for insert
  with check (
    exists (select 1 from public.students where id = student_id and teacher_id = auth.uid())
  );

create policy "mock_test_results: teacher update"
  on public.mock_test_results for update
  using    (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()))
  with check (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

create policy "mock_test_results: teacher delete"
  on public.mock_test_results for delete
  using (exists (select 1 from public.students where id = student_id and teacher_id = auth.uid()));

-- -------------------------------------------------------------------------
-- 19. settings  (has teacher_id directly)
-- -------------------------------------------------------------------------
alter table public.settings enable row level security;

create policy "settings: self or admin select"
  on public.settings for select
  using (teacher_id = auth.uid() or is_admin());

create policy "settings: self insert"
  on public.settings for insert
  with check (teacher_id = auth.uid());

create policy "settings: self update"
  on public.settings for update
  using    (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "settings: self delete"
  on public.settings for delete
  using (teacher_id = auth.uid());
