## ADDED Requirements

### Requirement: Homework service cô lập tiến độ bài tập theo buổi
Hệ thống SHALL truy cập dữ liệu `homeworks` qua một service (`src/services/homeworkService.js`) expose async: đọc theo buổi học, đọc theo học sinh, cập nhật tiến độ một bản ghi, cập nhật tiêu đề homework cho toàn buổi, và thống kê hoàn thành — trả Promise. Component UI SHALL KHÔNG gọi `supabase.from('homeworks')` trực tiếp.

#### Scenario: Đọc homework của một buổi
- **WHEN** mở một buổi học để xem bài tập
- **THEN** `homeworkService` trả về các bản ghi homework theo `session_id`

#### Scenario: Cập nhật tiến độ bài tập
- **WHEN** giáo viên đổi tiến độ một học sinh sang `done`
- **THEN** service cập nhật bản ghi tương ứng và trả về trạng thái mới

#### Scenario: Cập nhật tiêu đề homework theo buổi
- **WHEN** giáo viên đặt tiêu đề bài tập cho cả buổi
- **THEN** service cập nhật `title` cho các bản ghi homework của `session_id` đó

### Requirement: HW assignment service cô lập bài giao theo lớp
Hệ thống SHALL truy cập dữ liệu `hw_assignments` qua một service (`src/services/hwAssignmentService.js`) expose async: đọc theo lớp, tạo, cập nhật, xóa bài giao — trả Promise.

#### Scenario: Đọc bài giao của một lớp
- **WHEN** một component cần danh sách bài giao của một lớp
- **THEN** `hwAssignmentService` trả về các bài giao theo `class_id`

#### Scenario: Tạo bài giao qua service
- **WHEN** giáo viên tạo một bài giao cho lớp được giao
- **THEN** service insert vào `hw_assignments` và trả về bản ghi mới

### Requirement: Submission service cô lập nộp và chấm bài
Hệ thống SHALL truy cập dữ liệu `submissions` qua một service (`src/services/submissionService.js`) expose async: đọc theo bài giao, đọc theo học sinh, upsert (nộp + chấm điểm) theo khóa `(hw_assignment_id, student_id)`, và xóa theo bài giao — trả Promise.

#### Scenario: Upsert nộp/chấm idempotent
- **WHEN** chấm điểm một học sinh cho một bài giao đã có bản ghi
- **THEN** service upsert theo `(hw_assignment_id, student_id)` cập nhật `submitted`/`score`/`comment` không tạo bản ghi trùng

#### Scenario: Xóa submission khi xóa bài giao
- **WHEN** một bài giao bị xóa
- **THEN** các submission liên quan được xóa theo (qua service hoặc cascade DB), không còn bản ghi mồ côi

### Requirement: Component homework dùng trạng thái async
Hệ thống SHALL cho các component tiêu thụ homework nạp dữ liệu bất đồng bộ (loading + error state) thay vì đọc đồng bộ từ localStorage; thao tác ghi SHALL phản ánh lại UI sau khi Promise resolve.

#### Scenario: Hiển thị trạng thái tải
- **WHEN** bảng bài tập đang chờ service trả dữ liệu
- **THEN** UI hiển thị trạng thái đang tải rồi hiển thị dữ liệu khi resolve

#### Scenario: Báo lỗi khi ghi thất bại
- **WHEN** một lời gọi service homework bị từ chối
- **THEN** UI hiển thị thông báo lỗi thay vì trạng thái sai
