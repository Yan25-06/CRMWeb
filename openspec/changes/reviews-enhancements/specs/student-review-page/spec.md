## MODIFIED Requirements

### Requirement: ReviewsPage — trang nhận xét học viên
The ReviewsPage SHALL provide a complete student review interface with ViewModeToggle, DateRangeFilter, class/student selector (Individual mode), radar chart panel, quick review panel, review history, attendance panel, homework panel, general comment panel (Individual mode), and class overview table (Overview mode).

#### Scenario: Mở tab Nhận Xét
- **WHEN** user vào tab "Nhận Xét"
- **THEN** thấy ViewModeToggle [Cá Nhân|Tổng Quan Lớp], DateRangeFilter, và selector chọn lớp ở chế độ Cá Nhân mặc định

#### Scenario: Chọn lớp
- **WHEN** user chọn một lớp từ dropdown/pills
- **THEN** hiển thị danh sách học viên active của lớp đó (chế độ Cá Nhân)

#### Scenario: Chọn học viên
- **WHEN** user click vào một học viên ở chế độ Cá Nhân
- **THEN** hiển thị layout đầy đủ: RadarChartPanel, QuickReviewPanel, ReviewHistory, AttendancePanel, HomeworkPanel, GeneralCommentPanel

#### Scenario: Mobile responsive
- **WHEN** viewport width < 768px
- **THEN** layout 2 cột chuyển thành 1 cột xếp dọc (radar → tags/form → history → attendance → homework → general comment)

### Requirement: ReviewSelector — chọn lớp và học viên
The system SHALL provide a selector component with class filter (pills hoặc dropdown) and student list.

#### Scenario: Hiển thị danh sách học viên
- **WHEN** user chọn lớp
- **THEN** hiển thị danh sách học viên active trong lớp, mỗi item show tên + ảnh đại diện placeholder

#### Scenario: Tìm kiếm học viên
- **WHEN** user gõ tên vào ô search
- **THEN** danh sách filter realtime theo tên (debounce 200ms)

### Requirement: ReviewHistory — lịch sử nhận xét
The system SHALL display a timeline of past reviews for the selected student, sorted by date DESC, filtered by dateRange.

#### Scenario: Hiển thị lịch sử theo dateRange
- **WHEN** user chọn học viên có nhận xét trong dateRange
- **THEN** timeline hiển thị các entry trong khoảng ngày: ngày, điểm 4 kỹ năng (badges), tags, remark snippet

#### Scenario: Click để sửa
- **WHEN** user click vào một entry trong history
- **THEN** mở ReviewForm với data prefilled để sửa

#### Scenario: Không có lịch sử
- **WHEN** học viên chưa có nhận xét hoặc không có nhận xét trong dateRange
- **THEN** empty state: "Chưa có nhận xét trong khoảng thời gian này" + nút "Tạo Nhận Xét Đầu Tiên"
