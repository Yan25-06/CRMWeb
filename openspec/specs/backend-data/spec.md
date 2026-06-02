# Spec: Backend Data Layer (Supabase Services)

## Overview
Hệ thống sử dụng các service module để cô lập toàn bộ truy cập Supabase. Component UI SHALL KHÔNG gọi `supabase.*` trực tiếp; thay vào đó chúng phải dùng các hàm async của service tương ứng.

---

### Requirement: Student service cô lập truy cập học sinh
Hệ thống SHALL truy cập dữ liệu `students` qua một service (`src/services/studentService.js`) expose các thao tác async đọc/ghi trả Promise. Component UI SHALL KHÔNG gọi `supabase.from('students')` trực tiếp.

#### Scenario: UI đọc danh sách học sinh qua service
- **WHEN** một component cần danh sách học sinh
- **THEN** nó gọi hàm của `studentService` trả về Promise, không gọi `supabase.*` trực tiếp

#### Scenario: Tạo học sinh gán teacher_id
- **WHEN** giáo viên tạo một học sinh mới qua service
- **THEN** service gán `teacher_id = auth.uid()` và bản ghi được lưu thành công theo policy ghi của RLS

#### Scenario: Đọc học sinh không filter thủ công
- **WHEN** service đọc danh sách học sinh
- **THEN** nó KHÔNG thêm điều kiện `teacher_id` ở câu truy vấn; việc phân tách do RLS enforce ở DB

---

### Requirement: Class service cô lập truy cập lớp
Hệ thống SHALL truy cập dữ liệu `classes` qua một service (`src/services/classService.js`) expose các thao tác async đọc/ghi trả Promise. Khi giáo viên tạo lớp, service SHALL gán `teacher_id = auth.uid()`; khi cập nhật, service SHALL KHÔNG đổi `teacher_id`.

#### Scenario: UI đọc danh sách lớp qua service
- **WHEN** trang tổng quan lớp cần danh sách lớp
- **THEN** nó gọi `classService` trả Promise, không gọi `supabase.*` trực tiếp

#### Scenario: Cập nhật lớp giữ nguyên quyền sở hữu
- **WHEN** giáo viên cập nhật nội dung một lớp được giao
- **THEN** service cập nhật các cột nội dung và KHÔNG gửi thay đổi `teacher_id`

---

### Requirement: Enrollment service quản lý ghi danh
Hệ thống SHALL truy cập dữ liệu `enrollments` qua một service (`src/services/enrollmentService.js`) expose async đọc theo lớp, đọc một ghi danh `(student_id, class_id)`, upsert ghi danh, và lấy danh sách học sinh đang học (`status = 'active'`) của một lớp.

#### Scenario: Lấy học sinh đang học của lớp
- **WHEN** một component cần danh sách học sinh đang học của một lớp
- **THEN** `enrollmentService` trả về các bản ghi enrollment `active` của lớp đó kèm thông tin học sinh

#### Scenario: Upsert ghi danh idempotent
- **WHEN** ghi danh một học sinh đã có vào lớp đã có
- **THEN** service upsert theo khóa `(student_id, class_id)` không tạo bản ghi trùng

---

### Requirement: Component UI dùng trạng thái async cho học sinh và lớp
Hệ thống SHALL cho các component tiêu thụ `students`/`classes`/`enrollments` nạp dữ liệu bất đồng bộ (loading + error state) thay vì đọc đồng bộ từ localStorage. Các thao tác ghi SHALL phản ánh lại UI sau khi Promise resolve.

#### Scenario: Hiển thị trạng thái tải
- **WHEN** trang lớp/học sinh đang chờ service trả dữ liệu
- **THEN** UI hiển thị trạng thái đang tải và hiển thị dữ liệu khi Promise resolve

#### Scenario: Báo lỗi khi tải/ghi thất bại
- **WHEN** một lời gọi service bị từ chối (lỗi mạng hoặc RLS)
- **THEN** UI hiển thị thông báo lỗi thay vì dữ liệu sai

---

### Requirement: Session service cô lập truy cập buổi học
Hệ thống SHALL truy cập dữ liệu `sessions` qua một service (`src/services/sessionService.js`) expose async: đọc theo lớp, đọc theo id, tạo, cập nhật, xóa buổi học — trả Promise. Component UI SHALL KHÔNG gọi `supabase.from('sessions')` trực tiếp.

#### Scenario: Đọc buổi học của một lớp
- **WHEN** một component cần danh sách buổi học của một lớp
- **THEN** `sessionService` trả về các buổi học theo `class_id` (sắp theo `date`)

#### Scenario: Tạo buổi học qua service
- **WHEN** giáo viên tạo một buổi học cho lớp được giao
- **THEN** service insert vào `sessions` và trả về buổi học mới; RLS cho phép vì lớp thuộc giáo viên

---

### Requirement: Attendance service cô lập điểm danh
Hệ thống SHALL truy cập dữ liệu `attendance` qua một service (`src/services/attendanceService.js`) expose async: đọc theo buổi học, đọc theo học sinh, upsert một bản ghi điểm danh theo khóa `(session_id, student_id)`, và các truy vấn dẫn xuất (theo khoảng ngày, theo tháng) phục vụ thống kê chuyên cần.

#### Scenario: Đọc điểm danh của một buổi
- **WHEN** mở một buổi học để điểm danh
- **THEN** `attendanceService` trả về các bản ghi điểm danh của `session_id` đó

#### Scenario: Upsert điểm danh idempotent
- **WHEN** điểm danh một học sinh trong một buổi đã tồn tại bản ghi
- **THEN** service upsert theo `(session_id, student_id)` cập nhật `present`/`note` không tạo bản ghi trùng

---

### Requirement: Optimistic update khi điểm danh
Hệ thống SHALL cập nhật giao diện optimistic khi giáo viên tích điểm danh: UI đổi trạng thái `present` ngay lập tức trước khi server xác nhận, và SHALL rollback về trạng thái trước đó nếu lời gọi service thất bại.

#### Scenario: Tích điểm danh phản hồi tức thì
- **WHEN** giáo viên tích "có mặt" cho một học sinh
- **THEN** UI hiển thị trạng thái mới ngay lập tức và gửi upsert nền tới Supabase

#### Scenario: Rollback khi upsert thất bại
- **WHEN** lời gọi upsert điểm danh bị server từ chối hoặc lỗi mạng
- **THEN** UI hoàn nguyên ô điểm danh về trạng thái trước đó và thông báo lỗi

---

### Requirement: Schedule service cô lập lịch học
Hệ thống SHALL truy cập dữ liệu `schedule` qua một service (`src/services/scheduleService.js`) expose async: đọc toàn bộ/đọc theo ngày trong tuần, thêm, cập nhật, xóa mục lịch — trả Promise.

#### Scenario: Đọc lịch theo ngày trong tuần
- **WHEN** trang lịch cần các mục lịch của một ngày trong tuần
- **THEN** `scheduleService` trả về các mục lịch có `day_of_week` tương ứng

#### Scenario: Thêm mục lịch qua service
- **WHEN** giáo viên thêm một mục lịch cho lớp được giao
- **THEN** service insert vào `schedule` và trả về mục mới
