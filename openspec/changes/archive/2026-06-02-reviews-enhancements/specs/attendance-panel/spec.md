## ADDED Requirements

### Requirement: AttendancePanel — danh sách buổi + % chuyên cần
The system SHALL display an AttendancePanel in Individual mode for the selected student, showing a list of attendance sessions within the dateRange and computing attendance percentage.

#### Scenario: Hiển thị danh sách buổi
- **WHEN** user chọn học viên và dateRange hợp lệ
- **THEN** AttendancePanel hiển thị danh sách buổi (sort by date DESC) trong khoảng ngày: ngày học + trạng thái (Có mặt / Vắng + ghi chú vắng nếu có)

#### Scenario: Tính % chuyên cần
- **WHEN** AttendancePanel render
- **THEN** hiển thị "X/Y buổi — Z% chuyên cần" với X = số buổi có mặt, Y = tổng buổi trong dateRange, Z = X/Y * 100 (làm tròn 1 chữ số thập phân)

#### Scenario: Không có buổi học trong khoảng ngày
- **WHEN** không có attendance record nào trong dateRange của học viên đang chọn
- **THEN** empty state "Chưa có dữ liệu điểm danh trong khoảng thời gian này"

#### Scenario: Vị trí trong layout
- **WHEN** user đang ở chế độ Cá Nhân
- **THEN** AttendancePanel hiển thị bên dưới RadarChartPanel (cùng cột trái hoặc full-width dưới layout 2 cột)
