## ADDED Requirements

### Requirement: Email/password login
Hệ thống SHALL yêu cầu người dùng đăng nhập bằng email và mật khẩu qua Supabase Auth trước khi truy cập bất kỳ phần nghiệp vụ nào của app.

#### Scenario: Đăng nhập thành công
- **WHEN** người dùng nhập đúng email và mật khẩu rồi submit
- **THEN** hệ thống tạo session, lưu token, và hiển thị app nghiệp vụ

#### Scenario: Sai thông tin đăng nhập
- **WHEN** người dùng nhập sai email hoặc mật khẩu
- **THEN** hệ thống hiển thị thông báo lỗi và KHÔNG tạo session

### Requirement: Cổng xác thực chặn toàn app
Hệ thống SHALL chặn truy cập mọi phần nghiệp vụ khi chưa có session hợp lệ. Vì app điều hướng bằng state nội bộ (không dùng route), việc chặn SHALL thực hiện bằng một cổng xác thực bọc toàn bộ app.

#### Scenario: Truy cập khi chưa đăng nhập
- **WHEN** người dùng chưa đăng nhập mở app
- **THEN** hệ thống chỉ hiển thị trang đăng nhập, không render bất kỳ trang nghiệp vụ nào

#### Scenario: Phiên còn hiệu lực khi tải lại trang
- **WHEN** người dùng đã đăng nhập tải lại trang
- **THEN** hệ thống khôi phục session từ token đã lưu và hiển thị lại app mà không bắt đăng nhập lại

#### Scenario: Đang khôi phục session
- **WHEN** app vừa tải và đang xác định trạng thái session
- **THEN** hệ thống hiển thị trạng thái chờ, không nháy trang đăng nhập rồi mới vào app

### Requirement: Truy xuất vai trò người dùng
Hệ thống SHALL nạp profile từ bảng `teachers` sau khi đăng nhập và cung cấp cho toàn app thông tin người dùng hiện tại gồm `user`, `teacher` (profile + `is_admin`), và trạng thái `loading` qua một hook dùng chung.

#### Scenario: Nạp profile sau đăng nhập
- **WHEN** người dùng đăng nhập thành công
- **THEN** hệ thống nạp row `teachers` tương ứng `auth.uid()` và expose `is_admin` cho phần còn lại của app

### Requirement: Logout
Hệ thống SHALL cho phép người dùng đăng xuất và xóa session hiện tại.

#### Scenario: Đăng xuất
- **WHEN** người dùng bấm đăng xuất
- **THEN** hệ thống hủy session, xóa token, và quay về trang đăng nhập

### Requirement: Đặt mật khẩu lần đầu từ liên kết invite
Hệ thống SHALL cho phép giáo viên được admin invite (qua Supabase Dashboard) đặt mật khẩu lần đầu qua liên kết trong email.

#### Scenario: Giáo viên đặt mật khẩu lần đầu
- **WHEN** giáo viên mở liên kết invite trong email và nhập mật khẩu mới
- **THEN** hệ thống đặt mật khẩu, kích hoạt tài khoản, và cho phép vào app

#### Scenario: Liên kết invite hết hạn hoặc không hợp lệ
- **WHEN** giáo viên mở liên kết invite đã hết hạn hoặc đã dùng
- **THEN** hệ thống hiển thị lỗi và hướng dẫn liên hệ admin để được invite lại
