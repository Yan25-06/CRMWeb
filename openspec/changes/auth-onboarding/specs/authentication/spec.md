## MODIFIED Requirements

### Requirement: Đặt mật khẩu lần đầu từ liên kết invite
Hệ thống SHALL cho phép giáo viên được admin invite (qua Supabase Dashboard) đặt mật khẩu lần đầu qua liên kết trong email. Form đặt mật khẩu SHALL bao gồm ô nhập **Tên hiển thị** (bắt buộc, không rỗng); khi hoàn tất, hệ thống SHALL lưu tên vào `teachers.name` đồng thời với việc đặt mật khẩu.

#### Scenario: Giáo viên đặt mật khẩu và tên lần đầu
- **WHEN** giáo viên mở liên kết invite, nhập mật khẩu mới và tên hiển thị
- **THEN** hệ thống đặt mật khẩu, lưu tên vào `teachers.name`, kích hoạt tài khoản, và cho phép vào app

#### Scenario: Thiếu tên hiển thị
- **WHEN** giáo viên nhập mật khẩu nhưng để trống ô tên hiển thị
- **THEN** hệ thống hiển thị lỗi validate và không hoàn tất cho tới khi có tên

#### Scenario: Liên kết invite hết hạn hoặc không hợp lệ
- **WHEN** giáo viên mở liên kết invite đã hết hạn hoặc đã dùng
- **THEN** hệ thống hiển thị lỗi và hướng dẫn liên hệ admin để được invite lại
