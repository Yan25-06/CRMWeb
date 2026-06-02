## ADDED Requirements

### Requirement: ReviewRecord mở rộng — thêm fields cho radar chart
The data layer SHALL support extended ReviewRecord fields: `readScore` (number 0-9, optional), `listenScore` (number 0-9, optional), `tags` (string[], optional), `advice` (string, optional), `teacherName` (string, optional). Existing records without these fields SHALL continue to work (backward compatible).

#### Scenario: Tạo review với 4 kỹ năng
- **WHEN** user submit review form với listenScore, speakScore, readScore, writeScore
- **THEN** record được upsert vào `phf_reviews` với tất cả 4 điểm kỹ năng

#### Scenario: Đọc record cũ thiếu fields mới
- **WHEN** hệ thống đọc review record cũ không có `readScore/listenScore/tags/advice`
- **THEN** trả về record bình thường, fields mới = undefined, không crash

### Requirement: getReviewsByStudent — query reviews theo học viên
The data layer SHALL provide `getReviewsByStudent(studentId, classId)` trả về tất cả reviews của học viên trong lớp, sort theo `date` DESC.

#### Scenario: Query reviews cho biểu đồ radar
- **WHEN** RadarChartPanel cần dữ liệu cho học viên
- **THEN** `getReviewsByStudent(studentId, classId)` trả về mảng ReviewRecord sorted by date DESC

#### Scenario: Không có review
- **WHEN** học viên chưa có review nào
- **THEN** trả về mảng rỗng `[]`
