## ADDED Requirements

### Requirement: Mock test service cô lập bài thi thử
Hệ thống SHALL truy cập dữ liệu `mock_tests` qua một service (`src/services/mockTestService.js`) expose async: đọc theo lớp, tạo, cập nhật, xóa bài thi thử — trả Promise. Cột `sections` (jsonb) SHALL được ánh xạ trực tiếp sang object/array JS. Component UI SHALL KHÔNG gọi `supabase.from('mock_tests')` trực tiếp.

#### Scenario: Đọc bài thi thử của một lớp
- **WHEN** một component cần danh sách bài thi thử của một lớp
- **THEN** `mockTestService` trả về các bản ghi `mock_tests` theo `class_id`

#### Scenario: Tạo bài thi thử với sections jsonb
- **WHEN** giáo viên tạo một bài thi thử có cấu trúc `sections`
- **THEN** service ghi `sections` dạng jsonb và đọc lại thành object/array JS đúng cấu trúc

### Requirement: Mock test result service cô lập kết quả thi thử
Hệ thống SHALL truy cập dữ liệu `mock_test_results` qua một service (`src/services/mockTestResultService.js`) expose async: đọc theo bài thi, đọc theo học sinh, upsert kết quả theo `(mock_test_id, student_id)` — gồm `scores` (jsonb) và `total_score`. Trả Promise.

#### Scenario: Upsert kết quả idempotent
- **WHEN** nhập điểm cho một học sinh ở một bài thi đã có kết quả
- **THEN** service upsert theo `(mock_test_id, student_id)` cập nhật `scores`/`total_score` không tạo bản ghi trùng

#### Scenario: Đọc kết quả theo học sinh
- **WHEN** xem hồ sơ thi thử của một học sinh
- **THEN** service trả về các kết quả của học sinh đó với `scores` dạng object JS

### Requirement: Settings service cô lập cài đặt giáo viên
Hệ thống SHALL truy cập dữ liệu `settings` qua một service (`src/services/settingsService.js`) expose async: đọc cài đặt của giáo viên hiện tại và upsert theo `(teacher_id)` — trả Promise. Khi tạo, service SHALL gán `teacher_id = auth.uid()`.

#### Scenario: Đọc cài đặt của giáo viên hiện tại
- **WHEN** app cần cài đặt (tên trung tâm, đơn giá mặc định, đơn vị tiền)
- **THEN** `settingsService` trả về bản ghi `settings` theo `auth.uid()` hoặc giá trị mặc định nếu chưa có

#### Scenario: Upsert cài đặt idempotent
- **WHEN** giáo viên lưu cài đặt
- **THEN** service upsert theo `(teacher_id)` không tạo bản ghi trùng

### Requirement: Banner mất kết nối và retry khi ghi
Hệ thống SHALL hiển thị banner khi mất kết nối mạng và tự thử lại các thao tác ghi đang chờ khi mạng phục hồi. Thao tác ghi thất bại do mất mạng SHALL không làm mất dữ liệu người dùng đang nhập.

#### Scenario: Hiển thị banner khi mất mạng
- **WHEN** trình duyệt mất kết nối mạng
- **THEN** hệ thống hiển thị banner mất kết nối ở phạm vi toàn ứng dụng

#### Scenario: Tự retry khi mạng phục hồi
- **WHEN** mạng phục hồi sau khi một thao tác ghi thất bại vì mất kết nối
- **THEN** hệ thống tự thử lại thao tác ghi và ẩn banner khi thành công
