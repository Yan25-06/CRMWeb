## ADDED Requirements

### Requirement: Học sinh có trường email
Mô hình `Student` SHALL có trường `email` (tùy chọn, nullable). Khi học sinh chưa có email, hệ thống SHALL hiển thị giá trị trống một cách an toàn (ví dụ "—") thay vì lỗi.

#### Scenario: Lưu học sinh có email
- **WHEN** giáo viên nhập email khi tạo/sửa học sinh
- **THEN** giá trị `email` được lưu và đọc lại đúng cho UI

#### Scenario: Học sinh không có email
- **WHEN** một học sinh không có email
- **THEN** UI hiển thị placeholder trống ("—") và không phát sinh lỗi
