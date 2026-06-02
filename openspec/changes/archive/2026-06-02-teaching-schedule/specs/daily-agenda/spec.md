## ADDED Requirements

### Requirement: DailyAgenda — sidebar ca dạy hôm nay
The system SHALL display a sidebar panel showing today's teaching schedule as a compact list. Each item shows class name, time, room, and student count.

#### Scenario: Hiển thị ca dạy hôm nay
- **WHEN** user mở tab "Lịch Dạy" và hôm nay có ca dạy
- **THEN** DailyAgenda hiển thị danh sách ca dạy có `dayOfWeek` = ngày hôm nay, sắp xếp theo `startTime` ASC

#### Scenario: Không có ca dạy hôm nay
- **WHEN** hôm nay không có schedule item nào
- **THEN** DailyAgenda hiển thị "Hôm nay không có ca dạy" với icon calendar trống

#### Scenario: Phím tắt điểm danh nhanh
- **WHEN** user click vào nút "Điểm danh" trên một ca trong DailyAgenda
- **THEN** điều hướng đến tab Điểm Danh với lớp tương ứng được chọn sẵn

#### Scenario: Mobile layout
- **WHEN** viewport width < 768px
- **THEN** DailyAgenda hiển thị ở phía trên lưới (thay vì sidebar bên phải), có thể collapse/expand
