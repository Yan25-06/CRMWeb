## ADDED Requirements

### Requirement: HomeworkPanel — danh sách bài tập + % hoàn thành
The system SHALL display a HomeworkPanel in Individual mode for the selected student, showing homework assignments of the class within the dateRange and computing completion percentage.

#### Scenario: Hiển thị danh sách bài tập
- **WHEN** user chọn học viên và dateRange hợp lệ
- **THEN** HomeworkPanel hiển thị danh sách bài tập của lớp (filter theo `assignedAt` trong dateRange, sort by assignedAt DESC): tên bài + trạng thái nộp (Đã nộp / Chưa nộp) + điểm (nếu có)

#### Scenario: Tính % hoàn thành
- **WHEN** HomeworkPanel render
- **THEN** hiển thị "X/Y bài — Z% hoàn thành" với X = số bài có submission.submitted=true, Y = tổng bài trong dateRange, Z = X/Y * 100 (làm tròn 1 chữ số thập phân)

#### Scenario: Không có bài tập trong khoảng ngày
- **WHEN** không có homework nào trong dateRange của lớp
- **THEN** empty state "Chưa có bài tập được giao trong khoảng thời gian này"

#### Scenario: Vị trí trong layout
- **WHEN** user đang ở chế độ Cá Nhân
- **THEN** HomeworkPanel hiển thị cạnh hoặc bên dưới AttendancePanel, trước GeneralCommentPanel
