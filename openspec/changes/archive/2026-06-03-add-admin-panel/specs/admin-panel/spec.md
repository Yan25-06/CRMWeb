## ADDED Requirements

### Requirement: Trang quản lý chỉ dành cho admin
Hệ thống SHALL cung cấp Admin Panel chỉ truy cập được bởi tài khoản có `is_admin = true`; giáo viên thường SHALL bị chặn và chuyển hướng khỏi route admin.

#### Scenario: Teacher không vào được Admin Panel
- **WHEN** một giáo viên (không phải admin) cố mở route admin
- **THEN** hệ thống từ chối truy cập và chuyển hướng khỏi trang admin

#### Scenario: Admin mở Admin Panel
- **WHEN** admin đăng nhập và mở route admin
- **THEN** hệ thống hiển thị các chức năng quản lý (danh sách giáo viên, tạo/giao lớp, xem read-only)

### Requirement: Admin tạo và giao lớp cho giáo viên
Hệ thống SHALL cho phép admin tạo lớp và gán/đổi `teacher_id` của lớp cho một giáo viên cụ thể qua service layer. Lớp được giao SHALL hiển thị trong danh sách lớp của giáo viên đó.

#### Scenario: Tạo và giao lớp
- **WHEN** admin tạo lớp và chọn giáo viên phụ trách
- **THEN** lớp được lưu với `teacher_id` tương ứng và hiển thị trong danh sách lớp của giáo viên đó

#### Scenario: Đổi giáo viên phụ trách
- **WHEN** admin đổi `teacher_id` của một lớp sang giáo viên khác
- **THEN** lớp chuyển sang danh sách của giáo viên mới; thao tác được DB cho phép vì là ngoại lệ ghi của admin

### Requirement: Admin xem read-only dữ liệu toàn trung tâm
Hệ thống SHALL cho admin xem dữ liệu của mọi giáo viên ở chế độ chỉ đọc qua các service hiện có (admin có quyền SELECT-all nhờ RLS). Giao diện admin SHALL KHÔNG cung cấp thao tác sửa/xóa dữ liệu nghiệp vụ.

#### Scenario: Admin xem dữ liệu một giáo viên
- **WHEN** admin chọn xem lớp/học sinh/điểm danh của một giáo viên
- **THEN** hệ thống hiển thị dữ liệu mà không cung cấp nút sửa/xóa dữ liệu nghiệp vụ

#### Scenario: Admin bị chặn ghi ở cả UI và DB
- **WHEN** admin xem dữ liệu nghiệp vụ của một giáo viên
- **THEN** UI không hiển thị nút ghi; kể cả khi gọi trực tiếp, DB từ chối vì admin không có policy ghi (trừ `classes`)

### Requirement: Mời giáo viên qua Supabase Dashboard
Hệ thống SHALL dựa vào quy trình mời giáo viên qua Supabase Dashboard (Auth → Invite user); database trigger tự tạo row `teachers` khi user xác nhận. Admin Panel SHALL KHÔNG chứa luồng tạo tài khoản trong app.

#### Scenario: Giáo viên mới xuất hiện sau khi được mời
- **WHEN** admin mời một giáo viên qua Supabase Dashboard và giáo viên xác nhận
- **THEN** row `teachers` được trigger tạo tự động và giáo viên xuất hiện trong danh sách giáo viên của Admin Panel
