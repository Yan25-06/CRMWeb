## ADDED Requirements

### Requirement: Trang quản lý chỉ dành cho admin
Hệ thống SHALL cung cấp Admin Panel chỉ truy cập được bởi tài khoản có `is_admin = true`.

#### Scenario: Teacher không vào được Admin Panel
- **WHEN** một giáo viên (không phải admin) cố mở route admin
- **THEN** hệ thống từ chối truy cập và chuyển hướng khỏi trang admin

#### Scenario: Admin mở Admin Panel
- **WHEN** admin đăng nhập và mở route admin
- **THEN** hệ thống hiển thị các chức năng quản lý

### Requirement: Tạo tài khoản giáo viên qua invite
Hệ thống SHALL cho phép admin tạo tài khoản giáo viên bằng cách nhập email và tên; việc gửi invite SHALL chạy qua Edge Function dùng `service_role` key phía server, không lộ key ra frontend.

#### Scenario: Admin mời giáo viên mới
- **WHEN** admin nhập email và tên giáo viên rồi gửi
- **THEN** hệ thống tạo row `teachers`, gửi email invite, và giáo viên xuất hiện trong danh sách

#### Scenario: Edge Function xác thực người gọi là admin
- **WHEN** một request invite tới Edge Function không phải từ admin
- **THEN** Edge Function từ chối và không tạo tài khoản

### Requirement: Quản lý và phân lớp
Hệ thống SHALL cho phép admin tạo lớp và giao lớp cho một giáo viên cụ thể.

#### Scenario: Tạo và giao lớp
- **WHEN** admin tạo lớp và chọn giáo viên phụ trách
- **THEN** lớp được lưu với `teacher_id` tương ứng và hiển thị trong danh sách lớp của giáo viên đó

### Requirement: Xem read-only dữ liệu toàn trung tâm
Hệ thống SHALL cho admin xem dữ liệu của mọi giáo viên ở chế độ chỉ đọc, không có thao tác chỉnh sửa dữ liệu nghiệp vụ trên giao diện.

#### Scenario: Admin xem dữ liệu một giáo viên
- **WHEN** admin chọn xem lớp/học sinh của một giáo viên
- **THEN** hệ thống hiển thị dữ liệu mà không cung cấp nút sửa/xóa dữ liệu nghiệp vụ
