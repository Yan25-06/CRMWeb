## ADDED Requirements

### Requirement: Review service cô lập đánh giá học sinh
Hệ thống SHALL truy cập dữ liệu `reviews` qua một service (`src/services/reviewService.js`) expose async: đọc theo học sinh/lớp và upsert đánh giá theo `(student_id, class_id, date)` — gồm điểm 4 kỹ năng, `tags` (mảng), `remark`, `advice`, trạng thái vắng mặt. Component UI SHALL KHÔNG gọi `supabase.from('reviews')` trực tiếp.

#### Scenario: Đọc đánh giá của học sinh trong lớp
- **WHEN** trang nhận xét cần các đánh giá của một học sinh trong một lớp
- **THEN** `reviewService` trả về các bản ghi `reviews` theo `(student_id, class_id)`

#### Scenario: Upsert đánh giá idempotent
- **WHEN** lưu đánh giá cho một học sinh ở một ngày đã có bản ghi
- **THEN** service upsert theo `(student_id, class_id, date)` cập nhật điểm/tags/nhận xét không tạo bản ghi trùng

#### Scenario: Đọc/ghi cột tags dạng mảng
- **WHEN** lưu một đánh giá có nhiều tag
- **THEN** service ghi `tags` đúng kiểu mảng PostgreSQL và đọc lại thành mảng cho UI

### Requirement: Session review service cô lập nhận xét theo buổi
Hệ thống SHALL truy cập dữ liệu `session_reviews` qua một service (`src/services/sessionReviewService.js`) expose async: đọc theo học sinh/lớp và thêm nhận xét theo buổi — trả Promise.

#### Scenario: Đọc nhận xét theo buổi của học sinh
- **WHEN** một component cần các nhận xét theo buổi của một học sinh trong lớp
- **THEN** `sessionReviewService` trả về các bản ghi `session_reviews` theo `(student_id, class_id)`

#### Scenario: Thêm nhận xét theo buổi
- **WHEN** giáo viên thêm một nhận xét gắn với một buổi học
- **THEN** service insert bản ghi `session_reviews` với `session_id` tương ứng và trả về bản ghi mới

### Requirement: General comment service cô lập nhận xét chung
Hệ thống SHALL truy cập dữ liệu `general_comments` qua một service (`src/services/generalCommentService.js`) expose async: đọc một nhận xét chung theo `(student_id, class_id)` và upsert nội dung — trả Promise.

#### Scenario: Đọc nhận xét chung
- **WHEN** mở panel nhận xét chung của một học sinh trong lớp
- **THEN** `generalCommentService` trả về bản ghi theo `(student_id, class_id)` hoặc rỗng nếu chưa có

#### Scenario: Upsert nhận xét chung idempotent
- **WHEN** lưu nhận xét chung cho một học sinh đã có bản ghi
- **THEN** service upsert theo `(student_id, class_id)` cập nhật `text` không tạo bản ghi trùng

### Requirement: Component nhận xét dùng trạng thái async
Hệ thống SHALL cho các component tiêu thụ reviews nạp dữ liệu bất đồng bộ (loading + error state) thay vì đọc đồng bộ từ localStorage; thao tác ghi SHALL phản ánh lại UI sau khi Promise resolve.

#### Scenario: Hiển thị trạng thái tải
- **WHEN** trang/bảng nhận xét đang chờ service trả dữ liệu
- **THEN** UI hiển thị trạng thái đang tải rồi hiển thị dữ liệu khi resolve

#### Scenario: Báo lỗi khi ghi thất bại
- **WHEN** một lời gọi service reviews bị từ chối
- **THEN** UI hiển thị thông báo lỗi thay vì trạng thái sai
