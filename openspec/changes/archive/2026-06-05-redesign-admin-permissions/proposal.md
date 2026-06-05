## Why

Mô hình quyền hiện tại đặt admin là **read-only** trên toàn bộ dữ liệu nghiệp vụ (chỉ được ghi bảng `classes`). Nhưng trong thực tế chủ trung tâm (admin) cũng trực tiếp đứng lớp giảng dạy như một giáo viên: cần tạo học sinh, điểm danh, chấm bài, nhập điểm, nhận xét cho lớp của mình. Đồng thời chủ trung tâm cần quản lý học phí mà giáo viên không nên thấy. Mô hình read-only hiện tại chặn admin làm những việc này.

## What Changes

- **BREAKING (RLS):** Admin chuyển từ **read-only** sang **toàn quyền ghi (INSERT/UPDATE/DELETE) trên tất cả bảng nghiệp vụ** — như một giáo viên nhưng không bị giới hạn theo `teacher_id`. Cách làm: thêm nhánh `or is_admin()` vào các policy INSERT/UPDATE/DELETE của 16 bảng còn lại (students, enrollments, sessions, attendance, schedule, homeworks, hw_assignments, submissions, fees, payments, reviews, session_reviews, general_comments, mock_tests, mock_test_results, settings).
- **Quyền của teacher KHÔNG đổi** — vẫn chỉ đọc/ghi dữ liệu lớp được giao và học sinh của mình.
- **UI:** Ẩn mục "Học Phí" trên Navbar đối với tài khoản không phải admin (`!is_admin`). Trang FeesPage chỉ admin truy cập.
- **UI:** Admin thấy đầy đủ tất cả menu giống teacher (Dashboard, Điểm Danh, Báo Cáo, Nhận Xét, Lịch Dạy, Lớp Học) + mục Admin Panel. Báo Cáo vẫn hiển thị với teacher như hiện tại.
- **Admin Panel:** Bổ sung 4 stat card tổng quan (Tổng học viên, Lớp đang hoạt động, Số giáo viên, HS chưa đóng phí) phía trên các phần hiện có. Giữ nguyên phần tạo lớp / đổi giáo viên phụ trách.
- **Service:** `studentService.create()` chấp nhận `teacherId` tường minh (theo pattern đã có ở `classService`) để admin gán học sinh cho giáo viên khác.

## Capabilities

### New Capabilities
<!-- Không có capability mới -->

### Modified Capabilities
- `authorization`: Thay thế requirement "Admin read-only toàn bộ dữ liệu nghiệp vụ" bằng requirement mới "Admin toàn quyền ghi dữ liệu nghiệp vụ". Quyền teacher giữ nguyên.
- `pages`: Bổ sung điều kiện hiển thị Navbar — mục "Học Phí" chỉ hiện với admin; FeesPage chỉ admin truy cập. Admin Panel bổ sung dải stat card tổng quan.

## Impact

- **DB / RLS:** Migration mới thêm policy ghi cho admin trên 16 bảng. Không đổi schema, không đổi policy của teacher.
- **Service layer:** `studentService.create()` (gán `teacherId` tường minh).
- **UI:** `Navbar.jsx` (ẩn Học Phí theo vai trò), `AdminPanelPage.jsx` (thêm stat card), có thể `App.jsx` (guard route `fees`).
- **Seed data:** Không ảnh hưởng schema → không cần đổi `seed_mock_data.sql`.
