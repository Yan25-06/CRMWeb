## Context

Sau `add-supabase-schema` (bảng + cột phân quyền `teacher_id`/`class_id`/`student_id`, trigger tạo profile, admin seed) và `add-auth-login` (session thật, `useAuth` đọc `teachers`), các bảng vẫn đang mở. Change này bật RLS để enforce phân tách ở tầng PostgreSQL — frontend không thể lách vì anon key lộ ra client.

Quyết định nghiệp vụ đã chốt:
- Mỗi giáo viên dạy độc lập; học sinh thuộc đúng 1 giáo viên.
- Admin: read-all toàn bộ dữ liệu nghiệp vụ, KHÔNG sửa; ngoại lệ duy nhất là tạo/giao lớp.
- Admin tạo lớp rồi giao cho giáo viên; giáo viên không tự tạo lớp.

## Goals / Non-Goals

**Goals:**
- RLS bật trên mọi bảng; teacher chỉ đọc/ghi dữ liệu của mình, enforce ở DB.
- Bảng con suy quyền qua quan hệ về teacher sở hữu.
- Admin SELECT mọi dữ liệu; KHÔNG ghi dữ liệu nghiệp vụ.
- Admin INSERT/UPDATE `classes` để tạo & giao lớp (ngoại lệ).
- `useAuth` vẫn đọc được profile mình sau khi RLS bật.
- Bộ test phân tách A/B + admin chứng minh policy đúng.

**Non-Goals:**
- Service layer / UI gọi Supabase (→ #4–#9).
- UI Admin Panel tạo/giao lớp (→ #10) — ở đây chỉ mở policy cho admin ghi `classes`.
- Tối ưu hiệu năng policy (index) — chấp nhận cơ bản cho 5 user.

## Decisions

**1. Phân tách bằng RLS, không filter ở frontend.**
Mọi bảng gắn policy enforce ở PostgreSQL. Anon key lộ ra client nên filter phía service là không an toàn — loại.

**2. Helper `is_admin()` SECURITY DEFINER để tránh đệ quy RLS.**
Policy trên bảng nghiệp vụ cần biết caller có phải admin không → phải đọc `teachers`. Nếu đọc trực tiếp trong policy sẽ kích RLS trên `teachers` (đệ quy). Giải pháp: function `is_admin()` chạy SECURITY DEFINER đọc `teachers.is_admin` theo `auth.uid()`, bỏ qua RLS. Policy dùng `is_admin()` cho nhánh admin.
Cân nhắc khác: lưu `is_admin` trong JWT custom claim — mạnh hơn nhưng cần cấu hình hook phức tạp; để sau nếu cần.

**3. Policy `teachers`: self-read + self-update name, admin read-all.**
- SELECT: `id = auth.uid()` OR `is_admin()`.
- UPDATE: `id = auth.uid()` nhưng KHÔNG cho đổi `is_admin` (chặn leo thang) — kiểm tra bằng cách chỉ cho update khi `is_admin` giữ nguyên, hoặc tách cột tự-sửa. Đơn giản giai đoạn đầu: cho update `name` qua policy + (tùy chọn) trigger chặn đổi `is_admin`.
- INSERT/DELETE: không cấp cho client (trigger lo tạo; xóa làm qua Dashboard).

**4. Bảng gốc: ownership trực tiếp qua `teacher_id`.**
`students`, `classes`: SELECT/INSERT/UPDATE/DELETE khi `teacher_id = auth.uid()`; SELECT thêm nhánh `is_admin()`.

**5. Bảng con: suy quyền qua quan hệ.**
sessions/attendance/homeworks/fees/payments/reviews/session_reviews/mock_tests/mock_test_results/hw_assignments/submissions/general_comments/enrollments/schedule: policy kiểm tra bản ghi cha (`class_id`/`student_id`) thuộc về `auth.uid()` qua EXISTS subquery; admin SELECT all qua `is_admin()`. Ghi (INSERT/UPDATE/DELETE) chỉ khi cha thuộc về caller; admin KHÔNG có policy ghi.

**6. `classes` — ngoại lệ ghi cho admin.**
Admin được INSERT `classes` (gán `teacher_id` bất kỳ) và UPDATE `teacher_id` (giao/đổi giáo viên). Teacher chỉ UPDATE nội dung lớp `teacher_id = auth.uid()` và KHÔNG đổi `teacher_id` sang người khác. Đây là ngoại lệ ghi duy nhất của admin, ghi rõ comment trong migration để không vô tình nhân rộng.

**7. Admin read-only = vắng policy ghi.**
Trên các bảng nghiệp vụ (trừ `classes`), không tạo bất kỳ policy INSERT/UPDATE/DELETE nào cho nhánh admin → RLS từ chối ghi mặc định. Invariant quan trọng: thêm policy ghi cho admin sau này sẽ phá read-only.

## Risks / Trade-offs

- **Policy sai khóa toàn bộ truy cập** → test phân tách bắt buộc ở task cuối, chạy với 2 teacher + 1 admin thật.
- **Quên policy self-read `teachers` → login vỡ** (`useAuth` không nạp được profile). Mitigation: làm policy `teachers` đầu tiên, test login ngay.
- **EXISTS subquery bảng con chậm khi dữ liệu lớn** → 5 user, dữ liệu nhỏ, chấp nhận; thêm index `teacher_id`/`class_id` nếu cần.
- **Admin lỡ được cấp policy ghi** phá invariant read-only → comment cảnh báo trong migration + test "admin bị chặn ghi".
- **Đổi `is_admin` qua self-update** leo thang quyền → chặn bằng trigger/policy không cho đổi cột `is_admin`.

## Migration Plan

1. Viết migration: tạo `is_admin()` SECURITY DEFINER.
2. Bật RLS + policy cho `teachers` (self-read/update, admin read-all); deploy; test `useAuth` vẫn nạp profile.
3. Bật RLS + policy bảng gốc (`students`, `classes`) gồm ngoại lệ admin ghi `classes`.
4. Bật RLS + policy bảng con (suy quyền qua cha).
5. Áp toàn bộ; chạy bộ test phân tách A/B + admin.

Rollback: migration `disable row level security` + `drop policy`; vì dữ liệu là mock, an toàn.

## Open Questions

- Chặn đổi `is_admin` bằng trigger hay tách thành cột chỉ-Dashboard-sửa? (Đề xuất: trigger `BEFORE UPDATE` chặn nếu `new.is_admin <> old.is_admin` và caller không phải service_role.)
- Admin có cần DELETE `classes` không, hay chỉ tạo/giao? (Đề xuất: cho admin DELETE `classes` luôn để gỡ lớp tạo nhầm.)
