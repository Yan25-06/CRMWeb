## ADDED Requirements

### Requirement: Schema PostgreSQL cho toàn bộ entity
Hệ thống SHALL lưu dữ liệu trong PostgreSQL (Supabase) với bảng cho toàn bộ entity: teachers, students, classes, enrollments, sessions, attendance, homeworks, fees, payments, reviews, session_reviews, mock_tests, mock_test_results, hw_assignments, submissions, general_comments, settings, schedule. Mỗi bảng SHALL có khóa chính UUID sinh tự động.

#### Scenario: Tạo bản ghi sinh UUID
- **WHEN** một bản ghi mới được tạo ở bất kỳ bảng nào
- **THEN** hệ thống gán khóa chính UUID duy nhất và lưu thành công

#### Scenario: Đủ bảng cho mọi entity
- **WHEN** kiểm tra schema sau khi áp migration
- **THEN** tất cả các bảng entity nêu trên tồn tại trong database

### Requirement: Bảng teachers liên kết 1-1 với auth.users
Hệ thống SHALL có bảng `teachers` với `id` bằng `auth.users.id` (quan hệ 1-1), chứa các cột `email`, `name`, và cờ `is_admin` để phân biệt vai trò admin và teacher.

#### Scenario: Profile teacher gắn với tài khoản auth
- **WHEN** một tài khoản auth được tạo và có row tương ứng trong `teachers`
- **THEN** `teachers.id` bằng `auth.users.id` và profile (name, is_admin) truy xuất được qua id đó

#### Scenario: Phân biệt admin và teacher qua is_admin
- **WHEN** đọc một row `teachers`
- **THEN** cờ `is_admin` xác định tài khoản là admin (true) hay teacher (false)

### Requirement: Cột phân quyền trên các bảng
Hệ thống SHALL gắn cột phân quyền để xác định ownership: bảng gốc (`students`, `classes`) SHALL có `teacher_id`; các bảng con SHALL tham chiếu `class_id` và/hoặc `student_id` để quyền sở hữu suy được qua quan hệ. Các cột này SHALL có khóa ngoại tới bảng tương ứng.

#### Scenario: Bảng gốc mang teacher_id
- **WHEN** tạo một lớp hoặc một học sinh
- **THEN** bản ghi mang cột `teacher_id` xác định giáo viên sở hữu

#### Scenario: Bảng con tham chiếu lớp/học sinh
- **WHEN** tạo bản ghi ở bảng con (sessions, attendance, homeworks, fees, reviews...)
- **THEN** bản ghi mang `class_id` và/hoặc `student_id` trỏ tới bản ghi gốc, cho phép suy quyền sở hữu

### Requirement: Database trigger tự tạo profile teacher
Hệ thống SHALL có một database trigger `on_auth_user_created` (AFTER INSERT ON auth.users) tự động INSERT một row vào bảng `teachers` với `id`, `email` từ user mới và `name = ''`. Trigger SHALL chạy với `SECURITY DEFINER` để có quyền ghi vào `teachers`.

#### Scenario: Giáo viên mới được invite qua Dashboard
- **WHEN** admin invite một user mới qua Supabase Dashboard và user xác nhận email
- **THEN** hệ thống tự động tạo row trong `teachers` với đúng `id` và `email`, không cần thao tác thủ công nào thêm

#### Scenario: Trigger không ghi đè is_admin
- **WHEN** trigger tạo row `teachers` cho user mới
- **THEN** `is_admin` mặc định là `false`; chỉ được UPDATE thủ công cho tài khoản admin

### Requirement: Tài khoản admin được seed
Hệ thống SHALL có ít nhất một tài khoản admin (`is_admin = true`) được tạo thủ công sau khi áp schema, để dùng cho các luồng quản lý ở change sau.

#### Scenario: Admin tồn tại sau setup
- **WHEN** hoàn tất setup schema và seed
- **THEN** tồn tại đúng một row `teachers` với `is_admin = true` liên kết tới một tài khoản auth hợp lệ
