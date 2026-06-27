-- =========================================================================
-- Migration: Teacher per-session rate (đơn giá lương theo buổi)
-- Change: per-session-payroll
--
-- - teachers.session_rate: đơn giá mỗi buổi (admin set). Thay model lương tháng.
-- - monthly_salary giữ orphan (không drop) để tránh rủi ro; app ngừng dùng.
-- - Trigger prevent_salary_change mở rộng: chặn GV thường đổi cả session_rate.
--
-- Rollback:
--   alter table public.teachers drop column session_rate;
--   create or replace function public.prevent_salary_change()
--     returns trigger language plpgsql security definer as $$
--     begin
--       if new.monthly_salary is distinct from old.monthly_salary then
--         if not is_admin() then
--           raise exception 'permission denied: monthly_salary can only be changed by admin';
--         end if;
--       end if;
--       return new;
--     end; $$;
-- =========================================================================

alter table public.teachers
  add column if not exists session_rate numeric;

-- Mở rộng trigger: chỉ admin được đổi monthly_salary HOẶC session_rate.
create or replace function public.prevent_salary_change()
  returns trigger language plpgsql security definer as $$
begin
  if (new.monthly_salary is distinct from old.monthly_salary)
     or (new.session_rate is distinct from old.session_rate) then
    if not is_admin() then
      raise exception 'permission denied: salary/session_rate can only be changed by admin';
    end if;
  end if;
  return new;
end;
$$;

-- Trigger trg_prevent_salary_change đã tồn tại (migration 20260622000001)
-- và trỏ tới cùng function name → không cần tạo lại.
