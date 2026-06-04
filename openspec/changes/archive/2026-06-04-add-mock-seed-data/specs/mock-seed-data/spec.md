## ADDED Requirements

### Requirement: File seed SQL chạy được trong Supabase SQL Editor

Hệ thống SHALL cung cấp một file `supabase/seed/seed_mock_data.sql` chạy top-to-bottom trong Supabase SQL Editor (quyền owner, bypass RLS) mà không phát sinh lỗi, dựng đầy đủ dữ liệu mock cho toàn bộ tính năng.

#### Scenario: Chạy file một lần thành công
- **WHEN** người chạy điền đủ 3 placeholder email và Run toàn bộ file trong SQL Editor
- **THEN** tất cả câu lệnh INSERT thực thi không lỗi và dữ liệu mock xuất hiện ở mọi bảng liên quan

#### Scenario: Header cảnh báo điều kiện chạy
- **WHEN** mở file
- **THEN** phần comment header MUST nêu rõ: phải chạy trong SQL Editor, 3 email phải là tài khoản test, và phải điền placeholder trước khi chạy

### Requirement: Anchor vào teacher có sẵn qua placeholder email

Seed SHALL resolve `teacher_id` từ 3 giáo viên có sẵn thông qua placeholder email (`<<TEACHER_1_EMAIL>>`, `<<TEACHER_2_EMAIL>>`, `<<TEACHER_ADMIN_EMAIL>>`) và MUST KHÔNG tạo hay sửa row trong `auth.users` hoặc `teachers`.

#### Scenario: Resolve teacher theo email
- **WHEN** seed chạy với email hợp lệ đã điền
- **THEN** seed lấy đúng `teachers.id` tương ứng và dùng làm `teacher_id` cho students/classes/settings

#### Scenario: Email không khớp giáo viên nào
- **WHEN** một placeholder email không tồn tại trong bảng `teachers`
- **THEN** seed MUST dừng với thông báo lỗi rõ ràng (fail-fast) thay vì tạo dữ liệu mồ côi

#### Scenario: Không đụng auth
- **WHEN** seed chạy xong
- **THEN** số row trong `auth.users` và danh tính 3 teacher không thay đổi

### Requirement: UUID hợp lệ và đúng type cho mọi cột

Mọi mock row SHALL dùng UUID hợp lệ cho cột `id` và mọi FK, và mọi cột khác MUST đúng kiểu dữ liệu backend (date `YYYY-MM-DD`, time `HH:MM:SS`, timestamptz, smallint, integer, numeric, text[], jsonb, boolean).

#### Scenario: FK khớp giữa parent và child
- **WHEN** seed insert child row (enrollment, attendance, submission, ...)
- **THEN** mọi cột FK trỏ tới UUID literal của parent row đã insert trước đó, không vi phạm ràng buộc khóa ngoại

#### Scenario: Tiền tệ là integer không thập phân
- **WHEN** seed gán `monthly_fee`, `course_fee`, `payments.amount`, `fees.surcharge`
- **THEN** giá trị là integer (VNĐ, không phần thập phân)

#### Scenario: Điểm số là numeric
- **WHEN** seed gán `submissions.score`, `mock_test_results.total_score`
- **THEN** giá trị là numeric (cho phép thập phân, ví dụ 7.5)

### Requirement: Tôn trọng mọi CHECK và UNIQUE constraint

Seed SHALL chỉ dùng giá trị hợp lệ cho các cột có CHECK constraint và MUST KHÔNG tạo row vi phạm UNIQUE constraint.

#### Scenario: Giá trị enum hợp lệ
- **WHEN** seed gán `enrollments.status`, `enrollments.fee_type`, `homeworks.progress`, `payments.method`, `fees.month`, `schedule.day_of_week`
- **THEN** mỗi giá trị nằm trong tập hợp lệ (vd status ∈ active/paused/dropped, method ∈ cash/transfer, month 1–12, day_of_week 0–6)

#### Scenario: Không vi phạm unique
- **WHEN** seed insert vào các bảng có UNIQUE (enrollments, attendance, homeworks, submissions, fees, reviews, general_comments, mock_test_results)
- **THEN** không có cặp khóa unique trùng nhau trong dataset

### Requirement: jsonb đúng shape và đồng bộ với skill_config

Seed SHALL tạo các cột jsonb (`classes.skill_config`, `reviews.scores`, `mock_tests.sections`, `mock_test_results.scores`) đúng shape mà service layer mong đợi, và keys của `reviews.scores`/`mock_test_results.scores` MUST khớp tên kỹ năng/section của lớp tương ứng.

#### Scenario: Lớp IELTS dùng skill_config mặc định
- **WHEN** seed tạo lớp IELTS
- **THEN** `skill_config` là array `[{name,maxScore,order}]` với 4 kỹ năng Listening/Reading/Writing/Speaking thang 0–9

#### Scenario: Lớp custom skill_config
- **WHEN** seed tạo ít nhất một lớp không phải IELTS mặc định
- **THEN** lớp đó có `skill_config` khác mặc định để test cấu hình kỹ năng động

#### Scenario: Review scores khớp skill_config của lớp
- **WHEN** seed tạo review cho học viên thuộc một lớp
- **THEN** keys trong `reviews.scores` trùng tên kỹ năng trong `skill_config` của lớp đó, mỗi giá trị trong khoảng 0..maxScore

### Requirement: Variety bao phủ toàn bộ tính năng

Dataset SHALL chứa đủ biến thể để mọi màn hình, bộ lọc, drill-down và export đều có dữ liệu ý nghĩa.

#### Scenario: Đủ biến thể enum và trạng thái
- **WHEN** kiểm tra dataset
- **THEN** xuất hiện ≥1 lần mỗi: enrollment active/paused/dropped, fee_type monthly/course, homework not_done/in_progress/done, payment cash/transfer, fees.paid true/false, review.absent true/false

#### Scenario: Học viên đa dạng cho Students Directory
- **WHEN** kiểm tra students
- **THEN** có học viên có email và không email, và có ít nhất một học viên không thuộc lớp nào (test filter danh bạ)

#### Scenario: Session theo thời gian cho Dashboard và Reports
- **WHEN** kiểm tra sessions
- **THEN** có session quá khứ (đã điểm danh + bài tập), session hôm nay (DailyAgenda), và session tương lai

#### Scenario: Dữ liệu nhiều tháng cho biểu đồ Reports
- **WHEN** kiểm tra fees, payments, mock_tests
- **THEN** trải trên ≥2 mốc tháng để báo cáo vẽ được xu hướng theo thời gian

#### Scenario: Đủ dữ liệu cho Admin Panel
- **WHEN** đăng nhập bằng tài khoản admin
- **THEN** Admin Panel thấy nhiều giáo viên kèm lớp/dữ liệu read-only của họ (cả 3 teacher đều có dữ liệu mock)

### Requirement: Re-run an toàn (idempotent)

Seed SHALL chứa bước cleanup ở đầu file để chạy lại nhiều lần mà không nhân đôi dữ liệu hay vỡ FK, và cleanup MUST chỉ scope tới dữ liệu mock (theo teacher mock / literal UUID), không đụng dữ liệu của giáo viên khác hay row teacher/auth.

#### Scenario: Chạy lại lần hai
- **WHEN** chạy lại toàn bộ file lần thứ hai
- **THEN** dataset cuối giống lần đầu (không trùng lặp, không lỗi)

#### Scenario: Cleanup không lan ra ngoài scope mock
- **WHEN** bước cleanup thực thi
- **THEN** chỉ xóa dữ liệu mock của 3 teacher mục tiêu; không xóa row trong `teachers`/`auth.users`

### Requirement: Bước verification cuối file

Seed SHALL kết thúc bằng các câu `SELECT count(*)` cho mỗi bảng được seed để người chạy xác nhận kết quả.

#### Scenario: In số lượng row mỗi bảng
- **WHEN** chạy hết file
- **THEN** phần cuối trả về số lượng row đã seed cho từng bảng (students, classes, enrollments, sessions, attendance, homeworks, hw_assignments, submissions, fees, payments, reviews, session_reviews, general_comments, mock_tests, mock_test_results, settings, schedule)
