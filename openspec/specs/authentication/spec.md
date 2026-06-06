# Spec: Authentication

## Purpose
Xác thực người dùng qua Supabase Auth (email/mật khẩu), chặn truy cập app khi chưa đăng nhập, truy xuất vai trò người dùng, đăng xuất, và đặt mật khẩu lần đầu từ liên kết invite.

## Requirements

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
