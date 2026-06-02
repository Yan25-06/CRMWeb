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
