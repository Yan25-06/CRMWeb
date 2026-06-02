create table public.students (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.teachers(id) on delete cascade,
  name        text not null,
  grade       text,
  phone       text,
  created_at  timestamptz not null default now()
);

create table public.classes (
  id             uuid primary key default gen_random_uuid(),
  teacher_id     uuid not null references public.teachers(id) on delete cascade,
  name           text not null,
  level          text,
  max_students   integer,
  course_type    text,
  schedule_days  text,
  schedule_time  text,
  start_date     date,
  created_at     timestamptz not null default now()
);

create table public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.students(id) on delete cascade,
  class_id     uuid not null references public.classes(id) on delete cascade,
  status       text not null default 'active' check (status in ('active', 'paused', 'dropped')),
  fee_per_session integer,
  goal         text,
  note         text,
  enrolled_at  timestamptz not null default now(),
  paused_at    timestamptz,
  dropped_at   timestamptz,
  unique (student_id, class_id)
);
