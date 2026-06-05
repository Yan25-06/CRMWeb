## ADDED Requirements

### Requirement: Khôi phục mật khẩu tự phục vụ
Hệ thống SHALL cho phép người dùng tự yêu cầu khôi phục mật khẩu từ trang đăng nhập bằng cách nhập email và nhận liên kết reset qua email của Supabase. Hệ thống SHALL không tiết lộ liệu email có tồn tại hay không (phản hồi xác nhận chung để tránh dò tài khoản).

#### Scenario: Yêu cầu khôi phục mật khẩu
- **WHEN** người dùng bấm "Quên mật khẩu", nhập email và submit
- **THEN** hệ thống gọi Supabase gửi email reset với redirect về URL app và hiển thị thông báo xác nhận "nếu email tồn tại, liên kết đã được gửi"

#### Scenario: Đặt lại mật khẩu từ liên kết
- **WHEN** người dùng mở liên kết reset trong email
- **THEN** hệ thống nhận diện luồng `recovery` và hiển thị trang đặt mật khẩu mới để người dùng hoàn tất

#### Scenario: Email rỗng hoặc sai định dạng
- **WHEN** người dùng submit form quên mật khẩu mà chưa nhập email hợp lệ
- **THEN** hệ thống hiển thị lỗi xác thực và KHÔNG gọi gửi email
