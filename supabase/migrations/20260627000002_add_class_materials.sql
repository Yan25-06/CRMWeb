-- Tài liệu giảng dạy gắn theo lớp. Admin tạo/sửa/xóa, giáo viên chỉ đọc lớp mình.
create table if not exists public.class_materials (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  url text not null,
  type text not null check (type in ('slide', 'handout', 'listening', 'speaking', 'other')),
  created_by uuid references public.teachers(id),
  created_at timestamptz default now()
);

create index if not exists class_materials_class_id_idx on public.class_materials(class_id);

alter table public.class_materials enable row level security;

-- Admin: toàn quyền đọc/ghi
create policy "class_materials: admin all"
  on public.class_materials for all
  using (is_admin())
  with check (is_admin());

-- Giáo viên: chỉ SELECT tài liệu của lớp mình phụ trách
create policy "class_materials: teacher select"
  on public.class_materials for select
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_materials.class_id
        and c.teacher_id = auth.uid()
    )
  );
