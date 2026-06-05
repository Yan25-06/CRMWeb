## ADDED Requirements

### Requirement: Hiển thị thông tin tài khoản cá nhân

Trang Cài Đặt SHALL hiển thị section "Tài khoản cá nhân" cho mọi user, gồm tên hiển thị và email. Email SHALL luôn ở trạng thái read-only.

#### Scenario: Hiển thị tên và email ở chế độ đọc

- **WHEN** user mở trang Cài Đặt
- **THEN** section "Tài khoản cá nhân" hiển thị tên (từ `useAuth().teacher.name`) và email (từ `useAuth().user.email`) ở dạng read-only
- **AND** có nút "Chỉnh sửa" cho phần tên

#### Scenario: Tên rỗng fallback

- **WHEN** `teacher.name` chưa được đặt
- **THEN** hệ thống hiển thị email thay cho tên ở vị trí tên hiển thị

### Requirement: Chỉnh sửa tên hiển thị theo pattern edit button

Section "Tài khoản cá nhân" SHALL dùng pattern edit button: mặc định read-only, bấm "Chỉnh sửa" mới vào edit mode với nút Lưu và Hủy. Tên hiển thị SHALL được ghi vào `teachers.name` và đồng bộ với `useAuth`.

#### Scenario: Vào edit mode

- **WHEN** user bấm "Chỉnh sửa" ở section tài khoản
- **THEN** ô nhập tên xuất hiện với giá trị hiện tại, kèm nút "Lưu" và "Hủy"
- **AND** email vẫn read-only

#### Scenario: Lưu tên mới thành công

- **WHEN** user sửa tên và bấm "Lưu"
- **THEN** hệ thống ghi tên mới vào `teachers.name` qua `useAuth().updateTeacherName(name)`
- **AND** state `teacher` được refresh để Navbar và toàn app hiển thị tên mới
- **AND** hiện toast thành công, section trở về read-only

#### Scenario: Hủy chỉnh sửa

- **WHEN** user bấm "Hủy" trong edit mode
- **THEN** mọi thay đổi chưa lưu bị bỏ qua, section trở về read-only với giá trị cũ

#### Scenario: Tên rỗng khi lưu

- **WHEN** user xóa trống ô tên và bấm "Lưu"
- **THEN** hệ thống báo lỗi yêu cầu nhập tên và không ghi DB
