## ADDED Requirements

### Requirement: ReviewsPage — trang nhận xét học viên
The ReviewsPage SHALL provide a complete student review interface with class/student selector, radar chart panel, quick review panel, and review history.

#### Scenario: Mở tab Nhận Xét
- **WHEN** user vào tab "Nhận Xét"
- **THEN** thấy selector chọn lớp, không thấy placeholder cũ

#### Scenario: Chọn lớp
- **WHEN** user chọn một lớp từ dropdown/pills
- **THEN** hiển thị danh sách học viên active của lớp đó

#### Scenario: Chọn học viên
- **WHEN** user click vào một học viên
- **THEN** hiển thị layout 2 cột: bên trái RadarChartPanel, bên phải QuickReviewPanel + ReviewHistory

#### Scenario: Mobile responsive
- **WHEN** viewport width < 768px
- **THEN** layout 2 cột chuyển thành 1 cột xếp dọc (radar → tags/form → history)

### Requirement: ReviewSelector — chọn lớp và học viên
The system SHALL provide a selector component with class filter (pills hoặc dropdown) and student list.

#### Scenario: Hiển thị danh sách học viên
- **WHEN** user chọn lớp
- **THEN** hiển thị danh sách học viên active trong lớp, mỗi item show tên + ảnh đại diện placeholder

#### Scenario: Tìm kiếm học viên
- **WHEN** user gõ tên vào ô search
- **THEN** danh sách filter realtime theo tên (debounce 200ms)

### Requirement: ReviewHistory — lịch sử nhận xét
The system SHALL display a timeline of past reviews for the selected student, sorted by date DESC.

#### Scenario: Hiển thị lịch sử
- **WHEN** user chọn học viên có nhận xét cũ
- **THEN** timeline hiển thị các entry: ngày, điểm 4 kỹ năng (badges), tags, remark snippet

#### Scenario: Click để sửa
- **WHEN** user click vào một entry trong history
- **THEN** mở ReviewForm với data prefilled để sửa

#### Scenario: Không có lịch sử
- **WHEN** học viên chưa có nhận xét
- **THEN** empty state: "Chưa có nhận xét nào" + nút "Tạo Nhận Xét Đầu Tiên"
