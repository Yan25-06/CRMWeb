## Context

Routing là state `page` trong `App.jsx` (switch trong `renderPage()`), không dùng react-router. Navbar render từ mảng `NAV_ITEMS`. Học sinh ↔ lớp là quan hệ nhiều-nhiều qua `enrollments` (mỗi enrollment có `status`, `goal`, `monthly_fee`/`course_fee`). `studentService.getAll()` trả tất cả học sinh của giáo viên (RLS lọc theo `teacher_id`). `students` hiện chưa có cột `email`. Đã có `StudentModal` (tạo/sửa) và `EnrollmentModal` (ghi danh) tái dùng được.

## Goals / Non-Goals

**Goals:**
- Một trang danh bạ tổng tra cứu cross-class: lọc, tìm, tạo nhanh, xem chi tiết.
- Đồng nhất hoàn toàn với style và component dùng chung hiện có.
- Phát hiện học sinh "chưa xếp lớp" (không có enrollment nào).

**Non-Goals:**
- Không lặp lại chi tiết sâu của `StudentDetailPanel` (mock test/bài tập/timeline) — những thứ đó ở trong lớp.
- Không thay đổi mô hình enrollment hay logic học phí.
- Import Excel ở change này chỉ tạo hồ sơ học sinh (name/grade/phone/email); KHÔNG tự ghi danh vào lớp (xếp lớp làm sau).

## Decisions

### 1. Trang top-level mới, thêm vào `NAV_ITEMS`
Thêm `{ id: 'students', label: 'Học Sinh', icon: GraduationCap/UserRound }` vào `NAV_ITEMS` và case `students` trong `App.jsx`. Mobile bottom nav hiện chỉ hiển thị 5 mục đầu (`slice(0,5)`) — cân nhắc thứ tự để "Học Sinh" nằm trong nhóm chính hoặc chấp nhận chỉ hiện ở drawer.

### 2. Gộp dữ liệu ở page level, truyền xuống component con
`StudentsDirectoryPage` load song song `studentService.getAll()`, `classService.getAll()`, và enrollments (qua `enrollmentService` — đọc theo lớp rồi gộp, hoặc thêm 1 hàm đọc tất cả). Tính map `studentId → [enrollments]` một lần, truyền xuống bảng + sidebar để tránh N+1.

### 3. Cột `email` thêm nullable, không bắt buộc
Migration `ALTER TABLE students ADD COLUMN email text`. `studentService.fromDB/toDB` map thêm `email`. `StudentModal` thêm input email (optional). UI hiển thị `—` khi rỗng. Không breaking với dữ liệu cũ.

### 4. Filter "loại khóa" generate động
Pill loại khóa lấy từ `distinct(classes.course_type)` thực tế, không hardcode IELTS/TOEIC. Học sinh khớp nếu có enrollment vào lớp thuộc loại khóa đó.

### 5. "Thêm nhanh" tạo học sinh chưa xếp lớp
Ô input + Enter gọi `studentService.create({ name })` không kèm enrollment → học sinh xuất hiện ở tab "Chưa có lớp". Khác với `StudentModal` hiện tại vốn bắt buộc `classId`; ở trang này việc xếp lớp là tùy chọn (enroll sau qua `EnrollmentModal`).

### 6. Import Excel dùng `xlsx` + preview trước khi ghi
Modal import: chọn file `.xlsx` → đọc bằng `xlsx` (`XLSX.read` + `sheet_to_json`) → map cột theo header (`Tên`/`name`, `Khối`/`grade`, `SĐT`/`phone`, `Email`/`email`) → hiển thị bảng preview kèm validation (dòng thiếu tên = lỗi, bỏ qua; trùng tên cảnh báo). Giáo viên xác nhận → tạo tuần tự qua `studentService.create` (hoặc batch), hiển thị tiến độ + tổng kết "X thành công / Y lỗi". Cung cấp link tải file mẫu (template) để đúng định dạng cột. Import KHÔNG kèm enrollment.

### 7. Trạng thái học sinh = tổng hợp từ enrollments
Một học sinh nhiều lớp có thể nhiều trạng thái. Quy ước hiển thị: "Đang học" nếu có ít nhất 1 enrollment `active`; "Đã nghỉ" nếu tất cả `dropped`; "Tạm ngưng" nếu còn lại; "Chưa có lớp" nếu không có enrollment.

## Risks / Trade-offs

- **Đọc enrollments toàn bộ có thể nặng nếu nhiều lớp** → Gộp 1 lần ở page level, cân nhắc thêm hàm `enrollmentService.getAllForTeacher()` đọc theo `teacher_id` thay vì lặp từng lớp.
- **`StudentModal` hiện bắt buộc `classId`** → Cần cho phép tạo học sinh không lớp ở context trang này (thêm prop `requireClass={false}` hoặc dùng path tạo nhanh riêng).
- **Mobile bottom nav giới hạn 5 mục** → "Học Sinh" có thể chỉ xuất hiện trong drawer; chấp nhận hoặc điều chỉnh thứ tự `NAV_ITEMS`.
- **File Excel sai định dạng / cột lệch** → Map theo tên header linh hoạt + bảng preview để giáo viên kiểm tra trước khi ghi; cung cấp file mẫu để giảm sai sót.
- **Import số lượng lớn tạo tuần tự chậm** → Hiển thị tiến độ; cân nhắc batch insert nếu cần, nhưng vẫn qua `studentService` (không gọi `supabase` trực tiếp).

## Migration Plan

1. Migration thêm cột `students.email` (nullable).
2. Cập nhật `studentService` map `email`; `StudentModal` thêm input email.
3. Tạo `StudentsDirectoryPage` + component con (bảng, filter bar, sidebar).
4. Đăng ký route `students` trong `App.jsx` + mục Navbar.
5. Rollback: bỏ mục nav + case route, drop cột `email` (data email mất — chấp nhận).
