## ADDED Requirements

### Requirement: updateScheduleItem — cập nhật schedule item
The data layer SHALL provide an `updateScheduleItem(id, data)` function that updates an existing ScheduleItem in `phf_schedule` by ID, merging provided fields with existing record.

#### Scenario: Cập nhật schedule item thành công
- **WHEN** `updateScheduleItem(id, { room: "Phòng 201" })` được gọi với id hợp lệ
- **THEN** record tương ứng trong `phf_schedule` được cập nhật với field `room = "Phòng 201"`, các field khác giữ nguyên

#### Scenario: ID không tồn tại
- **WHEN** `updateScheduleItem(id, data)` được gọi với id không có trong `phf_schedule`
- **THEN** không có thay đổi nào trong storage, không throw error
