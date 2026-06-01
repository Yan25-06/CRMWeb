## ADDED Requirements

### Requirement: Email/password login
Hệ thống SHALL yêu cầu người dùng đăng nhập bằng email và mật khẩu qua Supabase Auth trước khi truy cập bất kỳ trang nghiệp vụ nào.

#### Scenario: Đăng nhập thành công
- **WHEN** người dùng nhập đúng email và mật khẩu rồi submit
- **THEN** hệ thống tạo session, lưu token, và chuyển tới dashboard tương ứng với vai trò

#### Scenario: Sai thông tin đăng nhập
- **WHEN** người dùng nhập sai email hoặc mật khẩu
- **THEN** hệ thống hiển thị thông báo lỗi và KHÔNG tạo session

### Requirement: Protected routes
Hệ thống SHALL chặn truy cập mọi route nghiệp vụ khi chưa có session hợp lệ.

#### Scenario: Truy cập khi chưa đăng nhập
- **WHEN** người dùng chưa đăng nhập mở một URL nội bộ (vd `/students`)
- **THEN** hệ thống chuyển hướng về trang đăng nhập

#### Scenario: Phiên còn hiệu lực khi tải lại trang
- **WHEN** người dùng đã đăng nhập tải lại trang
- **THEN** hệ thống khôi phục session từ token đã lưu mà không bắt đăng nhập lại

### Requirement: Logout
Hệ thống SHALL cho phép người dùng đăng xuất và xóa session hiện tại.

#### Scenario: Đăng xuất
- **WHEN** người dùng bấm đăng xuất
- **THEN** hệ thống hủy session, xóa token, và chuyển về trang đăng nhập

### Requirement: Invite-based account setup
Hệ thống SHALL cho phép giáo viên được admin mời thiết lập mật khẩu lần đầu qua liên kết invite.

#### Scenario: Giáo viên đặt mật khẩu lần đầu
- **WHEN** giáo viên mở liên kết invite trong email và nhập mật khẩu mới
- **THEN** hệ thống kích hoạt tài khoản, đặt mật khẩu, và cho phép đăng nhập

#### Scenario: Liên kết invite hết hạn hoặc không hợp lệ
- **WHEN** giáo viên mở liên kết invite đã hết hạn hoặc đã dùng
- **THEN** hệ thống hiển thị lỗi và hướng dẫn liên hệ admin để gửi lại
