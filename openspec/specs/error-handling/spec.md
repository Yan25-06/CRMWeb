# Spec: Error Handling

## Purpose
Bắt và xử lý lỗi runtime ở cấp toàn cục để tránh màn hình trắng và cung cấp trải nghiệm khôi phục cho người dùng.

## Requirements

### Requirement: Global render error recovery
Hệ thống SHALL bắt mọi lỗi render runtime ở cấp toàn cục bằng một error boundary bọc toàn bộ app, và hiển thị giao diện khôi phục tiếng Việt thay vì màn hình trắng. Giao diện khôi phục SHALL cung cấp hành động tải lại app.

#### Scenario: Lỗi render bị bắt
- **WHEN** một component con ném lỗi trong lúc render
- **THEN** hệ thống hiển thị màn hình khôi phục có thông báo tiếng Việt và nút "Tải lại trang", không để màn hình trắng

#### Scenario: Người dùng tải lại sau lỗi
- **WHEN** người dùng bấm nút "Tải lại trang" trên màn hình khôi phục
- **THEN** hệ thống tải lại app và quay về trạng thái hoạt động bình thường nếu lỗi đã hết

#### Scenario: Hoạt động bình thường không bị ảnh hưởng
- **WHEN** không có lỗi render xảy ra
- **THEN** error boundary render con bình thường, không thay đổi hành vi hay giao diện
