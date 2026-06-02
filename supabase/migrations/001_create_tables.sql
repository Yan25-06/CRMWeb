-- =========================================================
-- Migration 001: Create all tables
-- Run in Supabase SQL Editor
-- =========================================================

-- Teachers (1-1 with auth.users)
CREATE TABLE IF NOT EXISTS teachers (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classes (created by admin, assigned to a teacher)
CREATE TABLE IF NOT EXISTS classes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  name           TEXT NOT NULL,
  level          TEXT,
  max_students   INTEGER,
  course_type    TEXT,
  schedule_days  TEXT,
  schedule_time  TEXT,
  start_date     DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students (owned by one teacher)
CREATE TABLE IF NOT EXISTS students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  grade       TEXT,
  phone       TEXT,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enrollments (student ↔ class, with fee info per enrollment)
CREATE TABLE IF NOT EXISTS enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'active', -- active | paused | dropped
  fee_per_session INTEGER NOT NULL DEFAULT 0,
  goal            TEXT,
  note            TEXT,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at       TIMESTAMPTZ,
  dropped_at      TIMESTAMPTZ,
  UNIQUE(student_id, class_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id         UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  start_time       TIME,
  end_time         TIME,
  schedule_item_id UUID,
  created_manually BOOLEAN NOT NULL DEFAULT TRUE,
  topic            TEXT,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ
);

-- Attendance (per session per student)
CREATE TABLE IF NOT EXISTS attendance (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  present    BOOLEAN NOT NULL DEFAULT FALSE,
  note       TEXT,
  UNIQUE(session_id, student_id)
);

-- Homeworks (session-based stubs, one per active student per session)
CREATE TABLE IF NOT EXISTS homeworks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  progress   TEXT NOT NULL DEFAULT 'not_done', -- not_done | in_progress | done
  title      TEXT NOT NULL DEFAULT '',
  note       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Fees (monthly record per student)
CREATE TABLE IF NOT EXISTS fees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL,
  month           INTEGER NOT NULL,
  surcharge       INTEGER NOT NULL DEFAULT 0,
  note            TEXT,
  UNIQUE(student_id, year, month)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id   UUID REFERENCES classes(id) ON DELETE SET NULL,
  amount     INTEGER NOT NULL,
  paid_at    DATE NOT NULL,
  method     TEXT NOT NULL DEFAULT 'cash', -- cash | transfer
  period     TEXT NOT NULL, -- YYYY-MM
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews (periodic skill assessment)
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  listen_score  NUMERIC(3,1),
  speak_score   NUMERIC(3,1),
  read_score    NUMERIC(3,1),
  write_score   NUMERIC(3,1),
  remark        TEXT,
  tags          TEXT[],
  advice        TEXT,
  teacher_name  TEXT,
  absent        BOOLEAN DEFAULT FALSE,
  absent_reason TEXT,
  UNIQUE(student_id, class_id, date)
);

-- Session Reviews (quick per-session comments)
CREATE TABLE IF NOT EXISTS session_reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- General Comments (one per student per class)
CREATE TABLE IF NOT EXISTS general_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id   UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Mock Tests
CREATE TABLE IF NOT EXISTS mock_tests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  date         DATE NOT NULL,
  sections     JSONB NOT NULL DEFAULT '[]',
  teacher_note TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mock Test Results
CREATE TABLE IF NOT EXISTS mock_test_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scores       JSONB NOT NULL DEFAULT '{}',
  total_score  NUMERIC(10,2) DEFAULT 0,
  teacher_note TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(mock_test_id, student_id)
);

-- Homework Assignments (class-level)
CREATE TABLE IF NOT EXISTS hw_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  assigned_at DATE NOT NULL,
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submissions (per assignment per student)
CREATE TABLE IF NOT EXISTS submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hw_assignment_id UUID NOT NULL REFERENCES hw_assignments(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted        BOOLEAN NOT NULL DEFAULT FALSE,
  score            NUMERIC(5,2),
  comment          TEXT,
  graded_at        TIMESTAMPTZ,
  UNIQUE(hw_assignment_id, student_id)
);

-- Schedule items (recurring weekly slots per class)
CREATE TABLE IF NOT EXISTS schedule (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sun..6=Sat
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  room        TEXT,
  note        TEXT
);

-- Settings (one row per teacher)
CREATE TABLE IF NOT EXISTS settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id              UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE UNIQUE,
  teacher_name            TEXT NOT NULL DEFAULT '',
  center_name             TEXT NOT NULL DEFAULT 'Anh Ngữ Ms.Phương',
  default_fee_per_session INTEGER NOT NULL DEFAULT 0,
  currency                TEXT NOT NULL DEFAULT 'đ'
);
