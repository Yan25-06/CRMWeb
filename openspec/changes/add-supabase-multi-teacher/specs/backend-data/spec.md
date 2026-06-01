## ADDED Requirements

### Requirement: Schema PostgreSQL cho toàn bộ entity
Hệ thống SHALL lưu dữ liệu trong PostgreSQL (Supabase) với các bảng cho toàn bộ entity: teachers, students, classes, enrollments, sessions, attendance, homeworks, fees, payments, reviews, session_reviews, mock_tests, mock_test_results, hw_assignments, submissions, general_comments, settings, schedule. Mỗi bảng SHALL có khóa chính UUID.

#### Scenario: Tạo bản ghi sinh UUID
- **WHEN** tạo một bản ghi mới ở bất kỳ bảng nào
- **THEN** hệ thống gán khóa chính UUID và lưu thành công

#### Scenario: Quan hệ phân quyền
- **WHEN** tạo lớp hoặc học sinh
- **THEN** bản ghi SHALL mang `teacher_id` để xác định quyền sở hữu; bảng con tham chiếu `class_id`/`student_id`

### Requirement: Service layer cô lập backend khỏi UI
Hệ thống SHALL truy cập dữ liệu qua một service layer (`src/services/`); component UI KHÔNG được gọi client Supabase trực tiếp. Mỗi entity SHALL có một service expose các thao tác đọc/ghi trả về Promise.

#### Scenario: UI đọc dữ liệu qua service
- **WHEN** một component cần danh sách học sinh
- **THEN** nó gọi hàm của student service, không gọi `supabase.from(...)` trực tiếp

#### Scenario: Đổi backend chỉ sửa service layer
- **WHEN** thay thế Supabase bằng backend khác
- **THEN** chỉ các file trong `src/services/` cần thay đổi, component UI giữ nguyên

### Requirement: Optimistic UI và retry khi mất mạng
Hệ thống SHALL cập nhật giao diện optimistic cho thao tác ghi thường gặp và rollback khi server báo lỗi; SHALL hiển thị trạng thái mất kết nối và tự thử lại khi có mạng trở lại.

#### Scenario: Ghi optimistic thành công
- **WHEN** giáo viên điểm danh trong điều kiện mạng tốt
- **THEN** UI cập nhật ngay và xác nhận khi server trả thành công

#### Scenario: Rollback khi ghi thất bại
- **WHEN** một thao tác ghi optimistic bị server từ chối hoặc lỗi mạng
- **THEN** UI hoàn nguyên về trạng thái trước đó và thông báo lỗi

#### Scenario: Mất kết nối
- **WHEN** mất kết nối mạng
- **THEN** hệ thống hiển thị banner mất kết nối và tự thử lại khi mạng phục hồi
