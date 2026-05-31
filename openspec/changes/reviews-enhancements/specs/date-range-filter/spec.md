## ADDED Requirements

### Requirement: DateRangeFilter — bộ lọc khoảng ngày toàn trang
The system SHALL provide a DateRangeFilter component placed at the top of ReviewsPage, with two date inputs (fromDate, toDate) whose state is lifted to ReviewsPage and passed down to all panels.

#### Scenario: Giá trị mặc định
- **WHEN** ReviewsPage lần đầu render
- **THEN** fromDate = ngày đầu tháng hiện tại, toDate = ngày hôm nay

#### Scenario: Thay đổi fromDate
- **WHEN** user chọn fromDate mới
- **THEN** state tại ReviewsPage cập nhật, tất cả panels nhận dateRange mới và re-render với dữ liệu lọc

#### Scenario: Thay đổi toDate
- **WHEN** user chọn toDate mới
- **THEN** state tại ReviewsPage cập nhật, tất cả panels nhận dateRange mới và re-render

#### Scenario: fromDate > toDate
- **WHEN** user chọn fromDate lớn hơn toDate
- **THEN** DateRangeFilter hiển thị lỗi inline "Ngày bắt đầu không được sau ngày kết thúc", panels không thay đổi cho đến khi range hợp lệ

### Requirement: DateRangeFilter hiển thị trong cả 2 chế độ
The DateRangeFilter SHALL remain visible regardless of viewMode (individual hoặc overview), đặt cùng hàng với ViewModeToggle.

#### Scenario: Chuyển chế độ
- **WHEN** user toggle giữa [Cá Nhân] và [Tổng Quan Lớp]
- **THEN** DateRangeFilter vẫn hiển thị và giữ nguyên giá trị đã chọn
