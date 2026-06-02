## ADDED Requirements

### Requirement: WeeklyGrid — lưới lịch dạy 7 ngày
The system SHALL display a weekly grid with 7 columns (Thứ Hai → Chủ Nhật) showing all fixed schedule items from `phf_schedule`. Each column SHALL contain ScheduleCards sorted by `startTime` ASC.

#### Scenario: Render lưới tuần với ca dạy
- **WHEN** user mở tab "Lịch Dạy" và có schedule items trong `phf_schedule`
- **THEN** lưới hiển thị 7 cột, mỗi cột chứa các ScheduleCard thuộc `dayOfWeek` tương ứng, sắp xếp theo `startTime` ASC

#### Scenario: Lưới trống khi chưa có lịch
- **WHEN** `phf_schedule` rỗng
- **THEN** lưới hiển thị empty state với message "Chưa có lịch dạy" và nút CTA "Xếp Lịch Đầu Tiên"

#### Scenario: ScheduleCard hiển thị thông tin ca học
- **WHEN** lưới render một schedule item
- **THEN** ScheduleCard SHALL hiển thị: giờ học (`startTime - endTime`), tên lớp (lookup từ `phf_classes`), phòng học (`room`), số học viên active (count enrollment active của classId)

### Requirement: Color-coded theo courseType
The system SHALL apply color coding to ScheduleCards based on the `courseType` of the linked class. IELTS → navy palette, TOEIC → teal palette, Giao Tiếp → amber palette, unknown → gray fallback.

#### Scenario: Áp dụng màu cho IELTS
- **WHEN** schedule item thuộc lớp có `courseType = 'IELTS'`
- **THEN** ScheduleCard có background navy nhạt, border navy, text navy đậm

#### Scenario: Fallback color cho courseType không xác định
- **WHEN** schedule item thuộc lớp có `courseType` không nằm trong mapping
- **THEN** ScheduleCard dùng màu gray mặc định, không crash

### Requirement: Điều hướng tuần
The system SHALL provide navigation arrows (◄ / ►) to move between weeks. Header SHALL display current month/year.

#### Scenario: Chuyển tuần tiếp theo
- **WHEN** user click nút ►
- **THEN** tuần hiển thị dịch sang phải 1 tuần, header cập nhật tháng/năm tương ứng

#### Scenario: Quay về tuần hiện tại
- **WHEN** user click nút "Hôm nay"
- **THEN** lưới quay về tuần chứa ngày hiện tại

### Requirement: Mobile responsive layout
The system SHALL switch from 7-column grid to stacked daily view on screens narrower than 768px.

#### Scenario: Hiển thị trên mobile
- **WHEN** viewport width < 768px
- **THEN** lưới chuyển thành danh sách dọc theo từng ngày, không hiển thị grid 7 cột
