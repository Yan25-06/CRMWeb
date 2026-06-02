## ADDED Requirements

### Requirement: ViewModeToggle — chuyển đổi chế độ xem
The system SHALL provide a toggle with two modes — [Cá Nhân] và [Tổng Quan Lớp] — placed at the top of ReviewsPage alongside DateRangeFilter.

#### Scenario: Chế độ mặc định
- **WHEN** ReviewsPage lần đầu render
- **THEN** chế độ mặc định là Cá Nhân, toggle hiển thị "Cá Nhân" active

#### Scenario: Chuyển sang Tổng Quan Lớp
- **WHEN** user click [Tổng Quan Lớp]
- **THEN** ẩn ReviewSelector (student list), ẩn tất cả individual panels (radar, tags, history, attendance, homework, general comment), hiển thị ClassOverviewTable toàn width

#### Scenario: Chuyển về Cá Nhân
- **WHEN** user click [Cá Nhân] từ chế độ Tổng Quan
- **THEN** khôi phục layout Cá Nhân với học viên đang chọn (nếu có)

### Requirement: ClassOverviewTable — bảng tổng hợp học viên
The system SHALL display a table in overview mode summarizing all active students in the selected class, with columns computed from dateRange filter.

#### Scenario: Hiển thị bảng tổng hợp
- **WHEN** user đang ở chế độ Tổng Quan Lớp và đã chọn lớp
- **THEN** bảng hiển thị 1 hàng per học viên active với columns: Họ tên | % Chuyên cần | % Bài tập | Nhận xét gần nhất

#### Scenario: Cột nhận xét gần nhất
- **WHEN** học viên có review records
- **THEN** cột "Nhận xét gần nhất" hiển thị `remark` của review mới nhất; nếu remark rỗng thì hiển thị tags[0] hoặc "—"

#### Scenario: Lọc theo dateRange
- **WHEN** user thay đổi DateRangeFilter
- **THEN** % chuyên cần và % bài tập trong bảng được tính lại theo khoảng ngày mới

#### Scenario: Chưa chọn lớp
- **WHEN** user ở chế độ Tổng Quan nhưng chưa chọn lớp
- **THEN** hiển thị prompt "Chọn lớp để xem tổng quan"

#### Scenario: Lớp không có học viên
- **WHEN** lớp đang chọn không có học viên active
- **THEN** bảng hiển thị empty state "Lớp này chưa có học viên"

### Requirement: ClassPdfExport — xuất PDF nhiều trang toàn lớp
The system SHALL provide a "Xuất PDF Lớp" button in overview mode that generates a multi-page PDF, one page per student, using the same report card layout as individual export.

#### Scenario: Bắt đầu xuất PDF lớp
- **WHEN** user click "Xuất PDF Lớp" ở chế độ Tổng Quan
- **THEN** hiển thị loading indicator "Đang xử lý X/Y học viên", bắt đầu render từng student report card

#### Scenario: Hoàn thành xuất PDF
- **WHEN** tất cả học viên đã được render
- **THEN** download file PDF với tên `nhan-xet-lop-<tên lớp>-<fromDate>-<toDate>.pdf`, mỗi trang là phiếu kết quả của 1 học viên

#### Scenario: Lớp không có học viên active
- **WHEN** user click "Xuất PDF Lớp" mà lớp không có học viên
- **THEN** nút disabled với tooltip "Lớp chưa có học viên"
