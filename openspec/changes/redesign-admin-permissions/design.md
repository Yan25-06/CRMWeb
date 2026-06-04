## Context

Hệ thống dùng Row Level Security (RLS) ở PostgreSQL làm lớp enforce quyền duy nhất — frontend không filter quyền. Hiện trạng (migration `20260602000001_enable_rls_policies.sql`):

- Mỗi bảng nghiệp vụ có 4 policy teacher (select/insert/update/delete) suy quyền qua `teacher_id = auth.uid()` hoặc qua `class_id`/`student_id`.
- Admin chỉ có nhánh `or is_admin()` ở các policy **SELECT** → đọc được tất cả.
- Ngoại lệ ghi duy nhất của admin là bảng `classes` (insert/update/delete).
- `is_admin()` là hàm SECURITY DEFINER đọc `teachers.is_admin` không gây đệ quy RLS.

Yêu cầu mới: admin cũng đứng lớp như giáo viên nên cần toàn quyền ghi mọi bảng, đồng thời học phí bị ẩn khỏi giáo viên ở tầng UI.

## Goals / Non-Goals

**Goals:**
- Admin có quyền INSERT/UPDATE/DELETE trên tất cả bảng nghiệp vụ (không giới hạn `teacher_id`).
- Giữ nguyên hoàn toàn policy của teacher.
- Ẩn mục "Học Phí" và chặn FeesPage với tài khoản không phải admin ở tầng UI.
- Admin Panel hiển thị thêm dải stat card tổng quan.

**Non-Goals:**
- KHÔNG đổi cách giáo viên "thấy" học sinh (giữ `students.teacher_id` làm ownership trực tiếp — admin khi tạo học sinh sẽ gán `teacher_id` của giáo viên phụ trách qua tham số tường minh).
- KHÔNG thay đổi schema (không thêm/xóa cột, không đổi CHECK).
- KHÔNG thêm trang admin riêng để xem ClassDetailPage của giáo viên khác (admin dùng chung giao diện teacher).
- KHÔNG enforce ẩn học phí ở tầng DB (teacher vẫn có policy SELECT fees như cũ — chỉ ẩn ở UI). Xem Risk.

## Decisions

### 1. Thêm policy ghi cho admin bằng migration mới, không sửa migration cũ
Tạo file migration mới `supabase/migrations/<timestamp>_admin_full_write_access.sql` thêm các policy `"<table>: admin insert/update/delete"` với điều kiện `with check (is_admin())` / `using (is_admin())` cho 16 bảng. Giữ nguyên policy teacher hiện có.

**Vì sao policy riêng thay vì sửa policy teacher thành `... or is_admin()`?** Postgres RLS gộp nhiều permissive policy bằng OR. Thêm policy admin độc lập sạch hơn, dễ đọc, dễ rollback (drop riêng nhánh admin), và không phải viết lại 64 policy teacher.

`classes` đã có policy admin write → bỏ qua. Tổng cộng thêm policy cho 16 bảng còn lại × 3 (insert/update/delete) = 48 policy.

### 2. `studentService.create()` gán `teacherId` tường minh
Hiện `studentService.create()` luôn gắn `teacher_id = getUid()`. Sửa theo pattern `classService`: nếu `data.teacherId` có giá trị → dùng nó, ngược lại fallback `getUid()`. Cho phép admin tạo học sinh và gán cho giáo viên phụ trách đúng (để giáo viên đó thấy học sinh qua `students.teacher_id`).

### 3. Ẩn "Học Phí" ở UI theo `is_admin`
- `Navbar.jsx`: lọc mục "Học Phí" khỏi danh sách nav khi `!teacher?.is_admin`.
- `App.jsx`: khi `page === 'fees'` mà không phải admin → fallback về `dashboard` (guard giống cách `admin` được guard).

### 4. Admin Panel: thêm 4 stat card (hướng tối giản)
Dùng `StatCard` từ `@/components/ui`. 4 chỉ số: Tổng học viên, Lớp đang hoạt động, Số giáo viên, HS chưa đóng phí tháng hiện tại. Tận dụng service đã có (`studentService`, `classService`, `teacherService`, `feeService`). Không thêm bảng "theo giáo viên" hay biểu đồ — giữ scope nhỏ.

## Risks / Trade-offs

- **Học phí chỉ ẩn ở UI, không ẩn ở DB** → Giáo viên về lý thuyết vẫn có thể đọc bảng `fees`/`payments` qua API trực tiếp (policy SELECT teacher còn nguyên). → *Mitigation:* Chấp nhận trong scope này (yêu cầu chỉ là "ẩn với giáo viên" ở mức UI). Nếu cần chặn thật, một change sau có thể drop policy SELECT teacher trên `fees`/`payments`.
- **Admin có quyền xóa mọi thứ** → thao tác nhầm có thể xóa data của giáo viên khác. → *Mitigation:* UI luôn confirm trước khi xóa (đã là quy ước dự án); admin là vai trò tin cậy (chủ trung tâm).
- **Spec `authorization` mâu thuẫn requirement cũ "Admin read-only"** → phải MODIFY/REMOVE requirement đó trong delta spec để spec không tự mâu thuẫn.

## Migration Plan

1. Chạy migration mới trong Supabase SQL Editor (thêm 48 policy admin).
2. Deploy frontend (Navbar ẩn Học Phí, App guard, studentService, Admin Panel stat cards).
3. **Rollback:** drop các policy `"<table>: admin insert/update/delete"` vừa thêm → admin trở lại read-only. Frontend revert độc lập.
