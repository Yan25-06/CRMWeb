create table public.homeworks (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  progress    text not null default 'not_done' check (progress in ('not_done', 'in_progress', 'done')),
  title       text not null default '',
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (session_id, student_id)
);

create table public.hw_assignments (
  id           uuid primary key default gen_random_uuid(),
  class_id     uuid not null references public.classes(id) on delete cascade,
  title        text not null,
  description  text,
  assigned_at  date not null,
  due_date     date,
  created_at   timestamptz not null default now()
);

create table public.submissions (
  id               uuid primary key default gen_random_uuid(),
  hw_assignment_id uuid not null references public.hw_assignments(id) on delete cascade,
  student_id       uuid not null references public.students(id) on delete cascade,
  submitted        boolean not null default false,
  score            numeric,
  comment          text,
  graded_at        timestamptz,
  unique (hw_assignment_id, student_id)
);
