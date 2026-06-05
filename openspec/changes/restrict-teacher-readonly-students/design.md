## Context

Phân quyền hiện tại chỉ hai tầng qua `teachers.is_admin`. RLS enforce ở Postgres; admin có policy write độc lập (`is_admin()`) song song policy teacher (migration `20260604000001`). Teacher hiện có đủ INSERT/UPDATE/DELETE trên `students` và `mock_tests` trong phạm vi của mình (migration `20260602000001`).

Yêu cầu: teacher chỉ READ `students` và `mock_tests`; vẫn ghi được `mock_test_results` và các bảng nghiệp vụ khác. Chặn ở cả DB (thật) lẫn UI (trải nghiệm). Admin không đổi.

Điểm cần lưu ý ở UI:
- `EnrollmentModal` có 2 sub-mode: `existing` (gắn học sinh có sẵn) và `new` (tạo học sinh mới + thêm vào lớp). Sub-mode `new` gọi `studentService.create` → phải chặn với teacher.
- `EnrollmentModal` chế độ `edit` cho sửa cả thông tin học sinh lẫn enrollment. Sửa **thông tin học sinh** (`students`) phải chặn; sửa **enrollment** (status, học phí) vẫn cho phép vì `enrollments` không bị siết.
- `StudentDetailPanel.onEdit` mở luồng sửa; `MockTestCard` có `onEdit`/`onDelete` đề.

## Goals / Non-Goals

**Goals:**
- Drop quyền teacher write trên `students` và `mock_tests` ở RLS, giữ SELECT.
- Ẩn UI thao tác ghi học sinh và đề Mock Test khi `!is_admin`.
- Giữ nguyên: nhập điểm Mock Test, điểm danh, bài tập, nhận xét, sửa/đổi trạng thái enrollment.

**Non-Goals:**
- Không thêm vai trò thứ 3 hay đổi `is_admin` boolean thành enum.
- Không siết `enrollments` (teacher vẫn gắn học sinh vào lớp, đổi trạng thái, đặt học phí).
- Không đổi service layer (RLS tự chặn; service đã `throw` khi lỗi).
- Không siết bảng học phí/`fees` (đã ẩn UI ở change trước).

## Decisions

### 1. RLS: DROP policy teacher write thay vì thêm điều kiện
Drop 3 policy `students: teacher insert/update/delete` và 3 policy `mock_tests: teacher insert/update/delete`. Giữ nguyên policy SELECT của teacher và toàn bộ policy admin.

- **Vì sao drop, không sửa:** policy admin là permissive độc lập (`is_admin()`), Postgres OR-combine. Chỉ cần bỏ policy teacher write là teacher mất quyền ghi, admin không ảnh hưởng. Đối xứng với cách change admin đã làm → dễ rollback (re-create đúng 6 policy).
- **Alternative bỏ qua:** thêm `and is_admin()` vào policy teacher → rối nghĩa (policy "teacher" lại yêu cầu admin), khó đọc.

### 2. Truyền `isAdmin` xuống cây component qua prop
`App.jsx` đã có `teacher?.is_admin`. Truyền prop `isAdmin` xuống `StudentsDirectoryPage` và `ClassDetailPage` → `StudentsTab`/`MockTestTab` → component con (`StudentSidebar`, `StudentDetailPanel`, `MockTestCard`, `EnrollmentModal`).

- **Vì sao prop, không gọi `useAuth` trong từng component:** khớp pattern hiện tại (Navbar nhận `isAdmin` qua prop từ App). Tránh rải `useAuth` khắp nơi.
- **Alternative:** mỗi component tự `useAuth()` — gọn lời gọi nhưng lệch pattern và khó test.

### 3. EnrollmentModal: ép sub-mode `existing` khi teacher
Khi `!isAdmin`: ẩn toggle "Tạo học viên mới", luôn để `addSubMode='existing'`. Chế độ `edit`: ẩn/disable các field thuộc `students` (tên, SĐT, email, grade...), chỉ cho sửa field enrollment (status, feeType, phí). Nếu tách field phức tạp, tối thiểu ẩn nút mở luồng sửa thông tin học sinh ở `StudentDetailPanel` (`onEdit`) cho teacher và chỉ để đổi trạng thái.

- **Quyết định gọn:** với teacher, `StudentDetailPanel` chỉ hiện đổi trạng thái enrollment (không mở form sửa học sinh). Tạo học viên mới luôn ẩn.

### 4. UI là lớp phụ, DB là nguồn chân lý
Nếu sót một nút, RLS vẫn chặn và service `throw` → toast lỗi. UI chỉ để tránh thao tác vô nghĩa.

## Risks / Trade-offs

- **[Sót nút ghi ở UI]** → RLS vẫn chặn ở DB; rà các điểm: quick-add, "Thêm học sinh", Import Excel, bulk delete, sidebar edit/delete (Directory); add student, sửa thông tin học sinh (StudentsTab); tạo/sửa/xóa đề (MockTestTab).
- **[Teacher đang dùng luồng tạo học sinh khi ghi danh]** → BREAKING quy trình: từ nay admin phải tạo học sinh trước, teacher chỉ gắn vào lớp. Cần nêu trong README/CLAUDE.md.
- **[EnrollmentModal edit lẫn lộn field student vs enrollment]** → Mitigation: với teacher chỉ cho đổi trạng thái/học phí (enrollment), ẩn sửa thông tin cá nhân học sinh.
- **[Import Excel của teacher]** → ẩn nút; nếu gọi vẫn fail ở RLS.

## Migration Plan

1. Tạo migration `supabase/migrations/<timestamp>_restrict_teacher_students_mocktests.sql`:
   - `drop policy "students: teacher insert" on public.students;` (+ update, delete)
   - `drop policy "mock_tests: teacher insert" on public.mock_tests;` (+ update, delete)
2. Apply qua Supabase SQL Editor / migration pipeline.
3. UI: thêm prop `isAdmin`, ẩn điều khiển ghi.
4. Cập nhật `CLAUDE.md` (mô tả vai trò teacher read-only students + mock test) và README.
5. **Rollback:** re-create 6 policy đã drop (nội dung gốc trong `20260602000001_enable_rls_policies.sql`).
