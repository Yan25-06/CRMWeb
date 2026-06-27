-- Fix: teachers cannot see students enrolled in their classes when student was
-- created by admin (student.teacher_id = admin_uid ≠ teacher_uid).
--
-- The original policy only allowed teachers to see students they own directly.
-- This extends it to also allow teachers to see any student enrolled in one of
-- their classes, regardless of who created the student record.

drop policy "students: teacher or admin select" on public.students;

create policy "students: teacher or admin select"
  on public.students for select
  using (
    teacher_id = auth.uid()
    or is_admin()
    or exists (
      select 1
      from public.enrollments e
      join public.classes c on c.id = e.class_id
      where e.student_id = students.id
        and c.teacher_id = auth.uid()
    )
  );
