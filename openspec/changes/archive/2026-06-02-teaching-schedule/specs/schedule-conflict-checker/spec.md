## ADDED Requirements

### Requirement: Conflict detection — phát hiện xung đột lịch
The system SHALL detect scheduling conflicts when adding or editing a schedule item. Conflicts include: same room at overlapping times on the same day.

#### Scenario: Phát hiện trùng phòng
- **WHEN** user thêm/sửa schedule item có `dayOfWeek`, `room` (non-empty), và time range overlap với item khác cùng `dayOfWeek` + cùng `room`
- **THEN** hệ thống hiển thị cảnh báo đỏ trên modal: "Phòng [room] đã có lớp [tên lớp] từ [giờ] - [giờ]"

#### Scenario: Time overlap logic
- **WHEN** hai schedule items cùng `dayOfWeek`: item A (`startA`, `endA`) và item B (`startB`, `endB`)
- **THEN** overlap xảy ra khi `startA < endB AND startB < endA`

#### Scenario: Không có xung đột
- **WHEN** user thêm schedule item không trùng phòng hoặc không trùng thời gian
- **THEN** không hiển thị cảnh báo, cho phép lưu bình thường

#### Scenario: Override xung đột
- **WHEN** user thấy cảnh báo xung đột nhưng vẫn muốn lưu
- **THEN** hệ thống cho phép user xác nhận "Vẫn lưu" để force save, hoặc "Hủy" để quay lại sửa

#### Scenario: Bỏ qua phòng trống
- **WHEN** schedule item có `room` rỗng hoặc undefined
- **THEN** không kiểm tra xung đột phòng cho item đó (chỉ cảnh báo nếu trùng phòng có tên)
