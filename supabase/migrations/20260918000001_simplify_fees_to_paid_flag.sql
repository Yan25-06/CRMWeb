-- =========================================================================
-- Migration: Học phí chuyển sang mô hình "một ô tick"
-- Change: simplify-fees-to-paid-flag
--
-- - Mức học phí là thuộc tính của LỚP (classes.monthly_fee), không còn đặt
--   theo từng enrollment. Mọi học sinh trong lớp đóng như nhau.
-- - Trạng thái đóng phí là nhị phân: fees.paid. Không còn "đóng một phần".
-- - Các cột/bảng thôi dùng được giữ lại làm orphan (không drop) theo tiền lệ
--   của repo (monthly_salary, settings.teacher_name, class_materials):
--     enrollments.fee_type / monthly_fee / course_fee
--     fees.surcharge
--     payments (toàn bộ bảng — giữ lịch sử số tiền để tra cứu bằng SQL)
--
-- Rollback:
--   alter table public.classes drop column if exists monthly_fee;
--   (dữ liệu fees.paid do backfill đặt ra không tự khôi phục được — lịch sử
--    gốc vẫn nằm nguyên trong bảng payments.)
-- =========================================================================

alter table public.classes
  add column if not exists monthly_fee integer;

comment on column public.classes.monthly_fee is
  'Học phí cố định mỗi tháng của lớp (VNĐ). Nguồn duy nhất cho mức phí.';

-- -------------------------------------------------------------------------
-- Backfill 1: classes.monthly_fee = mức phí tháng phổ biến nhất trong các
-- enrollment chưa dropped của lớp. Lớp không có enrollment nào → để null.
-- -------------------------------------------------------------------------
with mode_fee as (
  select distinct on (e.class_id)
         e.class_id,
         e.monthly_fee,
         count(*) as n
  from public.enrollments e
  where e.status <> 'dropped'
    and e.monthly_fee is not null
    and e.monthly_fee > 0
  group by e.class_id, e.monthly_fee
  order by e.class_id, n desc, e.monthly_fee desc
)
update public.classes c
set monthly_fee = m.monthly_fee
from mode_fee m
where m.class_id = c.id
  and c.monthly_fee is null;

-- -------------------------------------------------------------------------
-- Backfill 2: fees.paid = true cho mỗi (student, class, year, month) mà tổng
-- payments của kỳ đó >= số phải đóng theo công thức CŨ.
-- Đóng một phần → không đạt ngưỡng → giữ paid = false (đã xác nhận với
-- người dùng trong spec).
-- -------------------------------------------------------------------------
with expected as (
  select e.student_id,
         e.class_id,
         f.year,
         f.month,
         case
           when e.fee_type = 'course' then coalesce(e.course_fee, 0)
           else coalesce(e.monthly_fee, 0) + coalesce(f.surcharge, 0)
         end as amount_due
  from public.enrollments e
  join public.fees f
    on f.student_id = e.student_id
   and f.class_id = e.class_id
  where e.status <> 'dropped'
),
paid_sum as (
  select p.student_id,
         p.class_id,
         split_part(p.period, '-', 1)::int as year,
         split_part(p.period, '-', 2)::int as month,
         sum(coalesce(p.amount, 0)) as amount_paid
  from public.payments p
  where p.class_id is not null
    and p.period ~ '^[0-9]{4}-[0-9]{2}$'
  group by p.student_id, p.class_id, p.period
)
update public.fees f
set paid = true
from expected ex
join paid_sum ps
  on ps.student_id = ex.student_id
 and ps.class_id   = ex.class_id
 and ps.year       = ex.year
 and ps.month      = ex.month
where f.student_id = ex.student_id
  and f.class_id   = ex.class_id
  and f.year       = ex.year
  and f.month      = ex.month
  and ex.amount_due > 0
  and ps.amount_paid >= ex.amount_due;
