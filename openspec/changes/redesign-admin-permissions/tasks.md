## 1. RLS Migration — Admin full write access

- [ ] 1.1 Tạo file migration mới `supabase/migrations/<timestamp>_admin_full_write_access.sql`
- [ ] 1.2 Thêm policy `admin insert/update/delete` (điều kiện `is_admin()`) cho: students, enrollments, sessions, attendance, schedule
- [ ] 1.3 Thêm policy `admin insert/update/delete` cho: homeworks, hw_assignments, submissions, fees, payments
- [ ] 1.4 Thêm policy `admin insert/update/delete` cho: reviews, session_reviews, general_comments, mock_tests, mock_test_results, settings
- [ ] 1.5 Xác nhận KHÔNG thêm cho `classes` (đã có policy admin write); xác nhận KHÔNG sửa policy teacher hiện có
- [ ] 1.6 Chạy migration trong Supabase SQL Editor, kiểm thử admin tạo/sửa/xóa 1 bản ghi ở vài bảng

## 2. Service layer

- [ ] 2.1 Sửa `studentService.create()` để dùng `data.teacherId` tường minh nếu có, fallback `getUid()` (theo pattern `classService`)
- [ ] 2.2 Map `teacherId` trong `toDB()` của `studentService` nếu chưa có

## 3. UI — Ẩn Học Phí với giáo viên

- [ ] 3.1 `Navbar.jsx`: ẩn mục "Học Phí" khi `!teacher?.is_admin`
- [ ] 3.2 `App.jsx`: guard route `fees` — nếu `page === 'fees'` và không phải admin → fallback `dashboard`

## 4. UI — Admin Panel stat cards

- [ ] 4.1 `AdminPanelPage.jsx`: nạp số liệu tổng quan (tổng học viên, lớp đang hoạt động, số giáo viên, HS chưa đóng phí tháng hiện tại) qua service layer
- [ ] 4.2 Render dải 4 `StatCard` phía trên phần Danh Sách Giáo Viên
- [ ] 4.3 Tính HS chưa đóng phí dùng cùng công thức học phí mà FeesPage dùng

## 5. Kiểm thử & tài liệu

- [ ] 5.1 Kiểm thử: admin thấy + truy cập được Học Phí; giáo viên không thấy mục và bị redirect khỏi `fees`
- [ ] 5.2 Kiểm thử: admin tạo học sinh gán cho giáo viên khác → giáo viên đó thấy học sinh
- [ ] 5.3 Kiểm thử: admin sửa/xóa điểm danh, điểm mock test của lớp giáo viên khác thành công
- [ ] 5.4 Kiểm thử: giáo viên thường vẫn chỉ thao tác được dữ liệu của mình (không hồi quy)
- [ ] 5.5 Cập nhật `CLAUDE.md` (phần quyền admin/RLS) và `README.md` nếu liên quan
