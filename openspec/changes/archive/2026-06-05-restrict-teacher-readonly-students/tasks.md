## 1. RLS Migration (DB)

- [x] 1.1 Tạo file `supabase/migrations/<timestamp>_restrict_teacher_students_mocktests.sql` với header mô tả change + rollback
- [x] 1.2 `drop policy "students: teacher insert"`, `"students: teacher update"`, `"students: teacher delete"` on `public.students`
- [x] 1.3 `drop policy "mock_tests: teacher insert"`, `"mock_tests: teacher update"`, `"mock_tests: teacher delete"` on `public.mock_tests`
- [ ] 1.4 Apply migration qua Supabase SQL Editor; verify teacher còn SELECT, mất write; admin và `mock_test_results` không đổi

## 2. Truyền isAdmin xuống component tree

- [x] 2.1 `src/App.jsx`: truyền prop `isAdmin={teacher?.is_admin}` cho `StudentsDirectoryPage` và `ClassDetailPage`
- [x] 2.2 `ClassDetailPage/index.jsx`: nhận `isAdmin`, truyền xuống `StudentsTab` và `MockTestTab`

## 3. Trang Danh bạ học viên (StudentsDirectoryPage)

- [x] 3.1 Nhận prop `isAdmin`; khi `!isAdmin` ẩn ô quick-add, nút "Thêm học sinh", "Import Excel"
- [x] 3.2 Khi `!isAdmin` ẩn nút "Xóa {n}" (bulk delete) và cột/checkbox chọn nhiều (hoặc giữ checkbox nhưng ẩn nút xóa)
- [x] 3.3 Khi `!isAdmin` ẩn nút thêm trong Empty state và edit/delete trong `StudentDetailSidebar`
- [x] 3.4 Giữ nguyên ExportExcelButton (chỉ đọc) và xem chi tiết

## 4. Tab Học Viên trong lớp (StudentsTab)

- [x] 4.1 `StudentsTab`: nhận `isAdmin`, truyền xuống `StudentSidebar` (ẩn `onAddStudent` khi `!isAdmin`) và `StudentDetailPanel`
- [x] 4.2 `StudentDetailPanel`: khi `!isAdmin` ẩn nút sửa thông tin học sinh (`onEdit`); chỉ giữ đổi trạng thái enrollment
- [x] 4.3 Empty state "Thêm học viên đầu tiên": ẩn nút khi `!isAdmin`

## 5. EnrollmentModal (chặn tạo học sinh mới)

- [x] 5.1 `EnrollmentModal`: nhận `isAdmin`; khi `!isAdmin` ẩn toggle "Tạo học viên mới", ép `addSubMode='existing'`
- [x] 5.2 Khi `!isAdmin` ở chế độ `edit`: ẩn/disable các field thuộc `students` (tên, SĐT, email, grade), chỉ cho sửa field enrollment (status, feeType, phí)
- [x] 5.3 Verify submit không gọi `studentService.create` khi teacher

## 6. Tab Mock Test (MockTestTab)

- [x] 6.1 `MockTestTab`: nhận `isAdmin`; khi `!isAdmin` ẩn nút "Tạo Mock Test mới" (cả header lẫn Empty state)
- [x] 6.2 `MockTestCard`: nhận `isAdmin`, ẩn nút `onEdit`/`onDelete` đề khi `!isAdmin`
- [x] 6.3 Verify chức năng nhập điểm (`onResultChange` → `mock_test_results`) vẫn hoạt động với teacher

## 7. Kiểm thử & tài liệu

- [x] 7.1 Test thủ công với tài khoản teacher: không thấy nút ghi học sinh/đề; vẫn nhập được điểm, điểm danh, sửa trạng thái enrollment
- [x] 7.2 Test thủ công với tài khoản admin: thấy đầy đủ thao tác như cũ
- [x] 7.3 Cập nhật `CLAUDE.md` mục vai trò/quyền (teacher read-only `students` + `mock_tests`, không tạo học sinh khi ghi danh)
- [x] 7.4 Cập nhật `README.md` phần phân quyền nếu có
