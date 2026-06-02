create table public.mock_tests (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes(id) on delete cascade,
  title        text not null,
  date         date not null,
  sections     jsonb not null default '[]',
  teacher_note text,
  created_at   timestamptz not null default now()
);

create table public.mock_test_results (
  id           uuid primary key default gen_random_uuid(),
  mock_test_id uuid not null references public.mock_tests(id) on delete cascade,
  student_id   uuid not null references public.students(id) on delete cascade,
  scores       jsonb not null default '{}',
  total_score  numeric not null default 0,
  teacher_note text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (mock_test_id, student_id)
);

create table public.settings (
  id                     uuid primary key default gen_random_uuid(),
  teacher_id             uuid not null references public.teachers(id) on delete cascade,
  teacher_name           text not null default '',
  center_name            text not null default '',
  default_fee_per_session integer not null default 0,
  currency               text not null default 'đ',
  unique (teacher_id)
);
