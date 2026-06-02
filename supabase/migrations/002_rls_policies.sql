-- =========================================================
-- Migration 002: Row Level Security policies
-- Run AFTER 001_create_tables.sql
--
-- Model:
--   teacher → sees/writes own students + assigned classes
--   admin   → sees ALL (read-only on business data)
--             only admin can INSERT/UPDATE/DELETE classes
-- =========================================================

-- Helper: check if current user is admin
-- SECURITY DEFINER so it can read teachers table regardless of caller RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM teachers WHERE id = auth.uid()),
    FALSE
  );
$$;

-- ── Enable RLS on all tables ─────────────────────────────
ALTER TABLE teachers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeworks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE general_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hw_assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule           ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings           ENABLE ROW LEVEL SECURITY;

-- ── teachers ─────────────────────────────────────────────
-- Teachers see only their own row; admin sees all
CREATE POLICY "teachers_select" ON teachers FOR SELECT
  USING (id = auth.uid() OR is_admin());

-- Only edge function (service_role) can INSERT teachers
-- No INSERT policy here → only service_role bypasses RLS

-- Teachers can update their own non-admin fields
CREATE POLICY "teachers_update_self" ON teachers FOR UPDATE
  USING (id = auth.uid() AND NOT is_admin())
  WITH CHECK (id = auth.uid());

-- ── classes ──────────────────────────────────────────────
CREATE POLICY "classes_select" ON classes FOR SELECT
  USING (teacher_id = auth.uid() OR is_admin());

-- Only admin can create and assign classes
CREATE POLICY "classes_insert" ON classes FOR INSERT
  WITH CHECK (is_admin());

-- Teacher can update their own class content (not teacher_id)
-- Admin can update anything (e.g., reassign teacher)
CREATE POLICY "classes_update" ON classes FOR UPDATE
  USING (teacher_id = auth.uid() OR is_admin());

-- Only admin can delete classes
CREATE POLICY "classes_delete" ON classes FOR DELETE
  USING (is_admin());

-- ── students ─────────────────────────────────────────────
CREATE POLICY "students_select" ON students FOR SELECT
  USING (teacher_id = auth.uid() OR is_admin());

CREATE POLICY "students_insert" ON students FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "students_update" ON students FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "students_delete" ON students FOR DELETE
  USING (teacher_id = auth.uid());

-- ── enrollments (derived from students + classes) ─────────
CREATE POLICY "enrollments_select" ON enrollments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = enrollments.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "enrollments_write" ON enrollments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = enrollments.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = enrollments.student_id AND teacher_id = auth.uid())
  );

-- ── sessions (derived from classes) ──────────────────────
CREATE POLICY "sessions_select" ON sessions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = sessions.class_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "sessions_write" ON sessions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = sessions.class_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM classes WHERE id = sessions.class_id AND teacher_id = auth.uid())
  );

-- ── attendance (derived from sessions → classes) ──────────
CREATE POLICY "attendance_select" ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = attendance.session_id
        AND (c.teacher_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "attendance_write" ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = attendance.session_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = attendance.session_id AND c.teacher_id = auth.uid()
    )
  );

-- ── homeworks (derived from sessions → classes) ───────────
CREATE POLICY "homeworks_select" ON homeworks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = homeworks.session_id
        AND (c.teacher_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "homeworks_write" ON homeworks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = homeworks.session_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = homeworks.session_id AND c.teacher_id = auth.uid()
    )
  );

-- ── fees (derived from students) ─────────────────────────
CREATE POLICY "fees_select" ON fees FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = fees.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "fees_write" ON fees FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = fees.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = fees.student_id AND teacher_id = auth.uid())
  );

-- ── payments (derived from students) ─────────────────────
CREATE POLICY "payments_select" ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = payments.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "payments_write" ON payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = payments.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = payments.student_id AND teacher_id = auth.uid())
  );

-- ── reviews (derived from students) ──────────────────────
CREATE POLICY "reviews_select" ON reviews FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = reviews.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "reviews_write" ON reviews FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = reviews.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = reviews.student_id AND teacher_id = auth.uid())
  );

-- ── session_reviews ───────────────────────────────────────
CREATE POLICY "session_reviews_select" ON session_reviews FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = session_reviews.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "session_reviews_write" ON session_reviews FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = session_reviews.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = session_reviews.student_id AND teacher_id = auth.uid())
  );

-- ── general_comments ──────────────────────────────────────
CREATE POLICY "general_comments_select" ON general_comments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = general_comments.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "general_comments_write" ON general_comments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = general_comments.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = general_comments.student_id AND teacher_id = auth.uid())
  );

-- ── mock_tests (derived from classes) ────────────────────
CREATE POLICY "mock_tests_select" ON mock_tests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = mock_tests.class_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "mock_tests_write" ON mock_tests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = mock_tests.class_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM classes WHERE id = mock_tests.class_id AND teacher_id = auth.uid())
  );

-- ── mock_test_results ─────────────────────────────────────
CREATE POLICY "mock_test_results_select" ON mock_test_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = mock_test_results.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "mock_test_results_write" ON mock_test_results FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = mock_test_results.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = mock_test_results.student_id AND teacher_id = auth.uid())
  );

-- ── hw_assignments (derived from classes) ────────────────
CREATE POLICY "hw_assignments_select" ON hw_assignments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = hw_assignments.class_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "hw_assignments_write" ON hw_assignments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = hw_assignments.class_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM classes WHERE id = hw_assignments.class_id AND teacher_id = auth.uid())
  );

-- ── submissions ───────────────────────────────────────────
CREATE POLICY "submissions_select" ON submissions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = submissions.student_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "submissions_write" ON submissions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students WHERE id = submissions.student_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE id = submissions.student_id AND teacher_id = auth.uid())
  );

-- ── schedule (derived from classes) ──────────────────────
CREATE POLICY "schedule_select" ON schedule FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = schedule.class_id AND (teacher_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "schedule_write" ON schedule FOR ALL
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = schedule.class_id AND teacher_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM classes WHERE id = schedule.class_id AND teacher_id = auth.uid())
  );

-- ── settings ─────────────────────────────────────────────
CREATE POLICY "settings_select" ON settings FOR SELECT
  USING (teacher_id = auth.uid() OR is_admin());

CREATE POLICY "settings_write" ON settings FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
