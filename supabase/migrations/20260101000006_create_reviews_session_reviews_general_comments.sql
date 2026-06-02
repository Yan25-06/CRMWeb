create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.students(id) on delete cascade,
  class_id       uuid not null references public.classes(id) on delete cascade,
  date           date not null,
  speak_score    numeric,
  write_score    numeric,
  read_score     numeric,
  listen_score   numeric,
  remark         text,
  tags           text[],
  advice         text,
  teacher_name   text,
  absent         boolean,
  absent_reason  text,
  unique (student_id, class_id, date)
);

create table public.session_reviews (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  session_id  uuid references public.sessions(id) on delete set null,
  text        text not null,
  created_at  timestamptz not null default now()
);

create table public.general_comments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  text        text not null default '',
  updated_at  timestamptz not null default now(),
  unique (student_id, class_id)
);
