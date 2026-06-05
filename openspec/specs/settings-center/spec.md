# settings-center Specification

## Purpose

Quản lý cài đặt thông tin trung tâm (tên trung tâm) dành cho admin trên trang Cài Đặt, và đảm bảo tên giáo viên chỉ lấy từ `teachers.name`.

## Requirements

### Requirement: Cài đặt thông tin trung tâm dành cho admin

Trang Cài Đặt SHALL hiển thị section "Thông Tin Trung Tâm" CHỈ khi user là admin (`teacher.is_admin = true`). Section này SHALL dùng pattern edit button và lưu tên trung tâm qua `settingsService`.

#### Scenario: Admin thấy section trung tâm

- **WHEN** admin mở trang Cài Đặt
- **THEN** section "Thông Tin Trung Tâm" hiển thị tên trung tâm (từ `settingsService.get()`) ở dạng read-only với nút "Chỉnh sửa"

#### Scenario: Giáo viên thường không thấy section trung tâm

- **WHEN** user không phải admin mở trang Cài Đặt
- **THEN** section "Thông Tin Trung Tâm" không được render

#### Scenario: Admin sửa tên trung tâm

- **WHEN** admin bấm "Chỉnh sửa", sửa tên trung tâm và bấm "Lưu"
- **THEN** hệ thống ghi qua `settingsService.upsert({ centerName })`
- **AND** hiện toast thành công và trở về read-only

#### Scenario: Admin hủy chỉnh sửa trung tâm

- **WHEN** admin bấm "Hủy"
- **THEN** thay đổi bị bỏ qua, section trở về read-only với giá trị cũ

### Requirement: Loại bỏ teacher_name khỏi settings service

`settingsService` SHALL không còn đọc/ghi field `teacher_name`. Tên giáo viên SHALL lấy duy nhất từ `teachers.name`.

#### Scenario: Service không map teacher_name

- **WHEN** `settingsService.get()` hoặc `upsert()` được gọi
- **THEN** kết quả không chứa field `teacherName` và không ghi cột `teacher_name`
