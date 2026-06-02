## ADDED Requirements

### Requirement: Session service cô lập truy cập buổi học
Hệ thống SHALL truy cập dữ liệu `sessions` qua một service (`src/services/sessionService.js`) expose async: đọc theo lớp, đọc theo id, tạo, cập nhật, xóa buổi học — trả Promise. Component UI SHALL KHÔNG gọi `supabase.from('sessions')` trực tiếp.

#### Scenario: Đọc buổi học của một lớp
- **WHEN** một component cần danh sách buổi học của một lớp
- **THEN** `sessionService` trả về các buổi học theo `class_id` (sắp theo `date`)

#### Scenario: Tạo buổi học qua service
- **WHEN** giáo viên tạo một buổi học cho lớp được giao
- **THEN** service insert vào `sessions` và trả về buổi học mới; RLS cho phép vì lớp thuộc giáo viên

### Requirement: Attendance service cô lập điểm danh
Hệ thống SHALL truy cập dữ liệu `attendance` qua một service (`src/services/attendanceService.js`) expose async: đọc theo buổi học, đọc theo học sinh, upsert một bản ghi điểm danh theo khóa `(session_id, student_id)`, và các truy vấn dẫn xuất (theo khoảng ngày, theo tháng) phục vụ thống kê chuyên cần.

#### Scenario: Đọc điểm danh của một buổi
- **WHEN** mở một buổi học để điểm danh
- **THEN** `attendanceService` trả về các bản ghi điểm danh của `session_id` đó

#### Scenario: Upsert điểm danh idempotent
- **WHEN** điểm danh một học sinh trong một buổi đã tồn tại bản ghi
- **THEN** service upsert theo `(session_id, student_id)` cập nhật `present`/`note` không tạo bản ghi trùng

### Requirement: Optimistic update khi điểm danh
Hệ thống SHALL cập nhật giao diện optimistic khi giáo viên tích điểm danh: UI đổi trạng thái `present` ngay lập tức trước khi server xác nhận, và SHALL rollback về trạng thái trước đó nếu lời gọi service thất bại.

#### Scenario: Tích điểm danh phản hồi tức thì
- **WHEN** giáo viên tích "có mặt" cho một học sinh
- **THEN** UI hiển thị trạng thái mới ngay lập tức và gửi upsert nền tới Supabase

#### Scenario: Rollback khi upsert thất bại
- **WHEN** lời gọi upsert điểm danh bị server từ chối hoặc lỗi mạng
- **THEN** UI hoàn nguyên ô điểm danh về trạng thái trước đó và thông báo lỗi

### Requirement: Schedule service cô lập lịch học
Hệ thống SHALL truy cập dữ liệu `schedule` qua một service (`src/services/scheduleService.js`) expose async: đọc toàn bộ/đọc theo ngày trong tuần, thêm, cập nhật, xóa mục lịch — trả Promise.

#### Scenario: Đọc lịch theo ngày trong tuần
- **WHEN** trang lịch cần các mục lịch của một ngày trong tuần
- **THEN** `scheduleService` trả về các mục lịch có `day_of_week` tương ứng

#### Scenario: Thêm mục lịch qua service
- **WHEN** giáo viên thêm một mục lịch cho lớp được giao
- **THEN** service insert vào `schedule` và trả về mục mới
