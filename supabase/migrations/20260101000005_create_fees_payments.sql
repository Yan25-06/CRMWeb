create table public.fees (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.students(id) on delete cascade,
  year              smallint not null,
  month             smallint not null check (month between 1 and 12),
  fee_per_session   integer,
  surcharge         integer not null default 0,
  paid              boolean not null default false,
  note              text,
  unique (student_id, year, month)
);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  class_id    uuid references public.classes(id) on delete set null,
  amount      integer not null,
  paid_at     date not null,
  method      text not null check (method in ('cash', 'transfer')),
  period      text not null,
  note        text,
  created_at  timestamptz not null default now()
);
