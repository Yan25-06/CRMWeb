## MODIFIED Requirements

### Requirement: Student service cô lập truy cập học sinh
Hệ thống SHALL truy cập dữ liệu `students` qua một service (`src/services/studentService.js`) expose các thao tác async đọc/ghi trả Promise, gồm ánh xạ cột `email` (tùy chọn) giữa DB và UI. Component UI SHALL KHÔNG gọi `supabase.from('students')` trực tiếp.

#### Scenario: UI đọc danh sách học sinh qua service
- **WHEN** một component cần danh sách học sinh
- **THEN** nó gọi hàm của `studentService` trả về Promise, không gọi `supabase.*` trực tiếp

#### Scenario: Tạo học sinh gán teacher_id
- **WHEN** giáo viên tạo một học sinh mới qua service
- **THEN** service gán `teacher_id = auth.uid()` và bản ghi được lưu thành công theo policy ghi của RLS

#### Scenario: Đọc học sinh không filter thủ công
- **WHEN** service đọc danh sách học sinh
- **THEN** nó KHÔNG thêm điều kiện `teacher_id` ở câu truy vấn; việc phân tách do RLS enforce ở DB

#### Scenario: Đọc/ghi trường email
- **WHEN** tạo hoặc cập nhật học sinh có/không có email
- **THEN** service ghi `email` (hoặc null) và đọc lại đúng giá trị cho UI
