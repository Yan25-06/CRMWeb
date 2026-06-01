## ADDED Requirements

### Requirement: Hai vai trò admin và teacher
Hệ thống SHALL phân biệt hai vai trò qua cờ `teachers.is_admin`: admin (quản lý) và teacher (giảng dạy). Mỗi tài khoản auth SHALL liên kết 1-1 với một row trong bảng `teachers`.

#### Scenario: Xác định vai trò sau đăng nhập
- **WHEN** người dùng đăng nhập thành công
- **THEN** hệ thống nạp profile từ bảng `teachers` và xác định vai trò theo `is_admin`

### Requirement: Teacher chỉ thấy dữ liệu được giao
Hệ thống SHALL giới hạn giáo viên chỉ đọc/ghi được dữ liệu của lớp được giao và học sinh thuộc về mình, enforce bằng Row Level Security ở PostgreSQL.

#### Scenario: Teacher xem lớp của mình
- **WHEN** giáo viên truy vấn danh sách lớp
- **THEN** hệ thống chỉ trả về các lớp có `teacher_id` bằng id của giáo viên đó

#### Scenario: Teacher không thấy dữ liệu giáo viên khác
- **WHEN** giáo viên A cố đọc lớp hoặc học sinh thuộc giáo viên B
- **THEN** hệ thống trả về rỗng / từ chối, không lộ dữ liệu của B

#### Scenario: Teacher sửa dữ liệu trong phạm vi của mình
- **WHEN** giáo viên tạo/sửa/xóa học sinh, điểm danh, điểm số trong lớp được giao
- **THEN** hệ thống cho phép thao tác ghi thành công

#### Scenario: Truy cập bảng con suy ra qua lớp/học sinh
- **WHEN** giáo viên đọc điểm danh, bài tập, học phí, nhận xét
- **THEN** hệ thống chỉ trả về bản ghi gắn với lớp được giao hoặc học sinh thuộc về giáo viên đó

### Requirement: Admin read-only toàn bộ
Hệ thống SHALL cho admin đọc dữ liệu của tất cả giáo viên nhưng KHÔNG cho phép admin tạo/sửa/xóa dữ liệu nghiệp vụ của giáo viên. Quy tắc read-only này SHALL được enforce ở tầng DB bằng việc không cấp policy ghi cho admin trên các bảng nghiệp vụ.

#### Scenario: Admin xem dữ liệu mọi giáo viên
- **WHEN** admin truy vấn lớp, học sinh, điểm danh của bất kỳ giáo viên nào
- **THEN** hệ thống trả về đầy đủ dữ liệu của tất cả giáo viên

#### Scenario: Admin bị chặn ghi dữ liệu nghiệp vụ
- **WHEN** admin cố tạo/sửa/xóa học sinh, điểm danh, hoặc điểm số của một giáo viên
- **THEN** hệ thống từ chối thao tác ghi ở tầng DB

### Requirement: Admin quản lý tài khoản và phân lớp
Hệ thống SHALL cho phép admin tạo tài khoản giáo viên, tạo lớp, và giao lớp cho giáo viên — đây là ngoại lệ ghi duy nhất dành cho admin.

#### Scenario: Admin tạo và giao lớp
- **WHEN** admin tạo một lớp và gán cho một giáo viên
- **THEN** hệ thống lưu lớp với `teacher_id` là giáo viên đó, và giáo viên đó thấy lớp trong danh sách của mình
