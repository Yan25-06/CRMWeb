## ADDED Requirements

### Requirement: Hai vai trò admin và teacher
Hệ thống SHALL phân biệt hai vai trò qua cờ `teachers.is_admin`: admin (quản lý) và teacher (giảng dạy). Mỗi tài khoản auth SHALL liên kết 1-1 với một row trong bảng `teachers`. Vai trò SHALL được xác định ở tầng DB qua một hàm helper dùng được trong RLS policy mà không gây đệ quy.

#### Scenario: Helper xác định admin trong policy
- **WHEN** một policy cần biết caller có phải admin không
- **THEN** hệ thống dùng hàm helper (SECURITY DEFINER) đọc `teachers.is_admin` theo `auth.uid()` mà không kích RLS đệ quy trên `teachers`

### Requirement: Người dùng đọc được profile của chính mình
Hệ thống SHALL cho phép mỗi tài khoản đọc row `teachers` của chính mình (và admin đọc tất cả), để client nạp được profile + vai trò sau khi RLS bật. Tài khoản SHALL KHÔNG tự nâng `is_admin` của mình.

#### Scenario: Nạp profile sau đăng nhập với RLS bật
- **WHEN** một user đã đăng nhập truy vấn profile của mình từ `teachers`
- **THEN** hệ thống trả về row có `id = auth.uid()`

#### Scenario: Chặn tự nâng quyền
- **WHEN** một teacher cố cập nhật `is_admin = true` cho chính mình
- **THEN** hệ thống từ chối thay đổi cờ `is_admin`

### Requirement: Teacher chỉ thấy và sửa dữ liệu được giao
Hệ thống SHALL giới hạn giáo viên chỉ đọc/ghi được dữ liệu của lớp được giao và học sinh thuộc về mình, enforce bằng Row Level Security ở PostgreSQL. Quyền trên bảng con SHALL suy ra qua `class_id`/`student_id` về teacher sở hữu.

#### Scenario: Teacher xem lớp của mình
- **WHEN** giáo viên truy vấn danh sách lớp
- **THEN** hệ thống chỉ trả về các lớp có `teacher_id` bằng id của giáo viên đó

#### Scenario: Teacher không thấy dữ liệu giáo viên khác
- **WHEN** giáo viên A cố đọc lớp hoặc học sinh thuộc giáo viên B
- **THEN** hệ thống trả về rỗng, không lộ dữ liệu của B

#### Scenario: Teacher ghi dữ liệu trong phạm vi của mình
- **WHEN** giáo viên tạo/sửa/xóa học sinh, điểm danh, điểm số trong lớp được giao
- **THEN** hệ thống cho phép thao tác ghi thành công

#### Scenario: Teacher bị chặn ghi dữ liệu của người khác
- **WHEN** giáo viên A cố tạo/sửa/xóa bản ghi gắn với lớp/học sinh của giáo viên B
- **THEN** hệ thống từ chối thao tác ghi ở tầng DB

#### Scenario: Truy cập bảng con suy ra qua lớp/học sinh
- **WHEN** giáo viên đọc điểm danh, bài tập, học phí, nhận xét
- **THEN** hệ thống chỉ trả về bản ghi gắn với lớp được giao hoặc học sinh thuộc về giáo viên đó

### Requirement: Admin read-only toàn bộ dữ liệu nghiệp vụ
Hệ thống SHALL cho admin đọc dữ liệu của tất cả giáo viên nhưng KHÔNG cho phép admin tạo/sửa/xóa dữ liệu nghiệp vụ. Quy tắc read-only này SHALL được enforce ở tầng DB bằng việc KHÔNG cấp policy ghi cho admin trên các bảng nghiệp vụ.

#### Scenario: Admin xem dữ liệu mọi giáo viên
- **WHEN** admin truy vấn lớp, học sinh, điểm danh của bất kỳ giáo viên nào
- **THEN** hệ thống trả về đầy đủ dữ liệu của tất cả giáo viên

#### Scenario: Admin bị chặn ghi dữ liệu nghiệp vụ
- **WHEN** admin cố tạo/sửa/xóa học sinh, điểm danh, hoặc điểm số của một giáo viên
- **THEN** hệ thống từ chối thao tác ghi ở tầng DB

### Requirement: Admin tạo và giao lớp
Hệ thống SHALL cho phép admin INSERT lớp và gán/đổi `teacher_id` của lớp — đây là ngoại lệ ghi duy nhất dành cho admin. Teacher SHALL chỉ cập nhật nội dung lớp được giao và SHALL KHÔNG đổi `teacher_id` sang giáo viên khác.

#### Scenario: Admin tạo và giao lớp
- **WHEN** admin tạo một lớp và gán cho một giáo viên
- **THEN** hệ thống lưu lớp với `teacher_id` là giáo viên đó, và giáo viên đó thấy lớp trong danh sách của mình

#### Scenario: Teacher không chuyển lớp cho người khác
- **WHEN** giáo viên cố đổi `teacher_id` của lớp mình sang một giáo viên khác
- **THEN** hệ thống từ chối thay đổi quyền sở hữu
