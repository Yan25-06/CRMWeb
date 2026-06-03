## 1. Database & service

- [ ] 1.1 Tạo migration `supabase/migrations/20260603xxxxxx_add_students_email.sql`: `ALTER TABLE students ADD COLUMN email text`
- [ ] 1.2 Áp migration lên Supabase và xác nhận schema
- [ ] 1.3 `studentService.js`: thêm `email` vào `fromDB` và `toDB`
- [ ] 1.4 (Nếu cần) thêm `enrollmentService.getAllForTeacher()` đọc toàn bộ enrollment để gộp ở page level

## 2. StudentModal — bổ sung email + tạo không lớp

- [ ] 2.1 Thêm input "Email" (optional) vào `StudentModal`
- [ ] 2.2 Cho phép tạo học sinh không bắt buộc `classId` khi mở ngoài context lớp (prop `requireClass={false}` hoặc tương đương)

## 3. Routing & Navbar

- [ ] 3.1 Thêm mục `{ id: 'students', label: 'Học Sinh', icon }` vào `NAV_ITEMS` trong `Navbar.jsx`
- [ ] 3.2 Thêm case `students` vào `renderPage()` trong `App.jsx`, render `StudentsDirectoryPage` (truyền `onNavigate`)
- [ ] 3.3 Xử lý điều hướng "Đến lớp": set `selectedClassId` + chuyển `page='classes'`

## 4. StudentsDirectoryPage — khung trang & dữ liệu

- [ ] 4.1 Tạo `src/pages/StudentsDirectoryPage.jsx`, header (h1 + mô tả ngắn, KHÔNG quote)
- [ ] 4.2 Load song song students + classes + enrollments; tính map `studentId → [enrollments]`
- [ ] 4.3 Skeleton loading + empty state đồng nhất các trang khác

## 5. Bảng danh bạ

- [ ] 5.1 Bảng cột: Học viên (avatar + tên + badge loại khóa), Trạng thái, Lớp học (badge), Liên hệ (email + SĐT), Mục tiêu, Thao tác
- [ ] 5.2 Tính trạng thái tổng hợp từ enrollments (active/paused/dropped/chưa có lớp)
- [ ] 5.3 Checkbox bulk select + nút xóa hàng loạt (có confirm)

## 6. Filter bar & tìm kiếm

- [ ] 6.1 Tabs trạng thái: Tất cả / Chưa có lớp / Đang học / Tạm ngưng / Đã nghỉ
- [ ] 6.2 Dropdown lọc theo lớp
- [ ] 6.3 Pill lọc theo loại khóa (generate từ `classes.course_type`)
- [ ] 6.4 Ô tìm theo tên / SĐT / email (dùng `useDebounce`)
- [ ] 6.5 Ô "Thêm nhanh (Tên + Enter)" tạo học sinh chưa xếp lớp
- [ ] 6.6 Nút "+ Thêm học sinh" mở `StudentModal`
- [ ] 6.7 Nút "Import Excel" mở modal import

## 7. Sidebar chi tiết

- [ ] 7.1 Panel chi tiết: thông tin cơ bản (tên, SĐT, email, ghi chú)
- [ ] 7.2 Danh sách lớp đang ghi danh + trạng thái + học phí tháng hiện tại (đã đóng/chưa)
- [ ] 7.3 Nút "Đến lớp" điều hướng sang `ClassDetailPage`
- [ ] 7.4 Nút sửa học sinh / ghi danh thêm lớp (tái dùng `EnrollmentModal`)

## 8. Import Excel hàng loạt

- [ ] 8.1 Tạo `ImportStudentsModal` — input chọn file `.xlsx`, đọc bằng `xlsx` (`XLSX.read` + `sheet_to_json`)
- [ ] 8.2 Map cột theo header linh hoạt (Tên/name, Khối/grade, SĐT/phone, Email/email)
- [ ] 8.3 Bảng preview + validation (thiếu tên = lỗi/bỏ qua, cảnh báo trùng tên)
- [ ] 8.4 Xác nhận → tạo tuần tự qua `studentService.create`, hiển thị tiến độ + tổng kết (X thành công / Y lỗi)
- [ ] 8.5 Nút tải file mẫu `.xlsx` đúng định dạng cột
- [ ] 8.6 Refresh danh bạ sau khi import xong

## 9. Kiểm thử & tài liệu

- [ ] 9.1 Test: lọc theo từng trạng thái/lớp/loại khóa, tìm kiếm, thêm nhanh, xóa hàng loạt
- [ ] 9.2 Test import Excel: file hợp lệ, file lỗi, dòng thiếu tên, tải file mẫu
- [ ] 9.3 Test responsive (desktop sidebar + mobile)
- [ ] 9.4 Cập nhật `CLAUDE.md` (routing + trang mới) và `README.md` nếu cần
