create table public.teachers (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text not null default '',
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);
