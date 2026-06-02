## ADDED Requirements

### Requirement: ScheduleModal — modal thêm/sửa lịch dạy
The system SHALL provide a modal form for creating and editing ScheduleItems with fields: Lớp học (select, required), Ngày trong tuần (select 1-7, required), Giờ bắt đầu (time input, required), Giờ kết thúc (time input, required), Phòng học (text input, optional), Ghi chú (textarea, optional).

#### Scenario: Mở modal thêm mới
- **WHEN** user click nút "+ Xếp Lịch"
- **THEN** modal mở với form rỗng, title "Thêm Lịch Dạy"

#### Scenario: Mở modal sửa
- **WHEN** user click vào ScheduleCard trên lưới
- **THEN** modal mở với form prefill dữ liệu hiện tại, title "Sửa Lịch Dạy"

#### Scenario: Validation khi submit
- **WHEN** user submit form thiếu field bắt buộc (classId, dayOfWeek, startTime, endTime) hoặc `startTime >= endTime`
- **THEN** hiện inline error tại field tương ứng, không đóng modal

#### Scenario: Submit thành công (thêm mới)
- **WHEN** form hợp lệ và user submit (mode thêm mới)
- **THEN** `addScheduleItem()` được gọi, modal đóng, toast success "Đã thêm lịch dạy", lưới refresh

#### Scenario: Submit thành công (cập nhật)
- **WHEN** form hợp lệ và user submit (mode sửa)
- **THEN** `updateScheduleItem()` được gọi, modal đóng, toast success "Đã cập nhật lịch dạy", lưới refresh

### Requirement: Xóa schedule item
The system SHALL allow users to delete a schedule item via confirmation dialog.

#### Scenario: Xóa lịch dạy
- **WHEN** user click nút xóa trên ScheduleCard hoặc trong modal sửa
- **THEN** hiện confirm dialog "Xóa lịch dạy này?"
- **WHEN** user xác nhận
- **THEN** `deleteScheduleItem()` được gọi, toast success "Đã xóa lịch dạy", lưới refresh

#### Scenario: Hủy xóa
- **WHEN** user click "Hủy" trên confirm dialog
- **THEN** không xóa, dialog đóng
