## MODIFIED Requirements

### Requirement: Class service cô lập truy cập lớp
Hệ thống SHALL truy cập dữ liệu `classes` qua một service (`src/services/classService.js`) expose các thao tác async đọc/ghi trả Promise. Khi giáo viên tạo lớp, service SHALL gán `teacher_id = auth.uid()`; khi cập nhật, service SHALL KHÔNG đổi `teacher_id`. Service SHALL ánh xạ cột `skill_config` (jsonb) sang trường `skillConfig` (mảng `{ name, maxScore, order }`); khi `skill_config` rỗng/null, service SHALL trả về bộ kỹ năng IELTS mặc định.

#### Scenario: UI đọc danh sách lớp qua service
- **WHEN** trang tổng quan lớp cần danh sách lớp
- **THEN** nó gọi `classService` trả Promise, không gọi `supabase.*` trực tiếp

#### Scenario: Cập nhật lớp giữ nguyên quyền sở hữu
- **WHEN** giáo viên cập nhật nội dung một lớp được giao
- **THEN** service cập nhật các cột nội dung và KHÔNG gửi thay đổi `teacher_id`

#### Scenario: Đọc/ghi cấu hình kỹ năng của lớp
- **WHEN** giáo viên lưu lớp với một bộ kỹ năng tùy chỉnh
- **THEN** service ghi `skill_config` dạng jsonb và đọc lại thành `skillConfig` (mảng object) cho UI; lớp chưa cấu hình trả về bộ mặc định IELTS

### Requirement: Review service cô lập đánh giá học sinh
Hệ thống SHALL truy cập dữ liệu `reviews` qua một service (`src/services/reviewService.js`) expose async: đọc theo học sinh/lớp và upsert đánh giá theo `(student_id, class_id, date)` — gồm điểm kỹ năng dạng `scores` (jsonb, keyed theo tên kỹ năng), `tags` (mảng), `remark`, `advice`, trạng thái vắng mặt. Component UI SHALL KHÔNG gọi `supabase.from('reviews')` trực tiếp.

#### Scenario: Đọc đánh giá của học sinh trong lớp
- **WHEN** trang nhận xét cần các đánh giá của một học sinh trong một lớp
- **THEN** `reviewService` trả về các bản ghi `reviews` theo `(student_id, class_id)` với `scores` dạng object JS

#### Scenario: Upsert đánh giá idempotent
- **WHEN** lưu đánh giá cho một học sinh ở một ngày đã có bản ghi
- **THEN** service upsert theo `(student_id, class_id, date)` cập nhật `scores`/tags/nhận xét không tạo bản ghi trùng

#### Scenario: Đọc/ghi điểm kỹ năng dạng scores jsonb
- **WHEN** lưu một đánh giá có điểm cho nhiều kỹ năng
- **THEN** service ghi `scores` dạng jsonb keyed theo tên kỹ năng và đọc lại thành object JS cho UI

#### Scenario: Đọc/ghi cột tags dạng mảng
- **WHEN** lưu một đánh giá có nhiều tag
- **THEN** service ghi `tags` đúng kiểu mảng PostgreSQL và đọc lại thành mảng cho UI
