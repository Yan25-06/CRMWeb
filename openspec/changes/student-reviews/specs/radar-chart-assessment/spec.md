## ADDED Requirements

### Requirement: RadarChart — biểu đồ năng lực 4 kỹ năng
The system SHALL display a radar chart (chart.js type `radar`) showing 4 skill axes: Listening, Speaking, Reading, Writing with scores from 0 to 9.

#### Scenario: Hiển thị biểu đồ radar cho học viên
- **WHEN** user chọn một học viên có ít nhất 1 review record
- **THEN** biểu đồ radar hiển thị 4 trục (Nghe, Nói, Đọc, Viết) với điểm từ review mới nhất

#### Scenario: Overlay nhiều đợt đánh giá
- **WHEN** học viên có >= 2 review records
- **THEN** biểu đồ radar overlay các datasets (mỗi đợt = 1 đường màu khác), legend hiển thị tháng/năm

#### Scenario: Không có dữ liệu đánh giá
- **WHEN** học viên chưa có review record nào
- **THEN** hiển thị biểu đồ radar trống với message "Chưa có đánh giá nào" và nút CTA "Tạo Đánh Giá Đầu Tiên"

### Requirement: ReviewForm — form chấm điểm kỹ năng định kỳ
The system SHALL provide a modal form to create/edit skill assessment reviews with fields: Ngày (date, required), Nghe (number 0-9), Nói (number 0-9), Đọc (number 0-9), Viết (number 0-9), Lời khuyên (textarea, optional).

#### Scenario: Tạo đánh giá mới
- **WHEN** user click "Thêm Đánh Giá" và submit form hợp lệ
- **THEN** review record được lưu vào `phf_reviews` với 4 điểm kỹ năng, biểu đồ radar cập nhật

#### Scenario: Sửa đánh giá cũ
- **WHEN** user click vào entry trong review history
- **THEN** form mở với data prefilled, submit cập nhật record, radar refresh

#### Scenario: Validation
- **WHEN** user nhập điểm ngoài khoảng 0-9
- **THEN** inline error hiện tại field, không cho submit
