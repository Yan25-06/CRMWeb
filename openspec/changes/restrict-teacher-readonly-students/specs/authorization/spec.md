## MODIFIED Requirements

### Requirement: Teacher chỉ thấy và sửa dữ liệu được giao
Hệ thống SHALL giới hạn giáo viên chỉ đọc/ghi được dữ liệu của lớp được giao và học sinh thuộc về mình, enforce bằng Row Level Security ở PostgreSQL. Quyền trên bảng con SHALL suy ra qua `class_id`/`student_id` về teacher sở hữu. Trong phạm vi đó, giáo viên SHALL chỉ có quyền **đọc** (SELECT) trên bảng `students` và bảng `mock_tests` — giáo viên SHALL KHÔNG được INSERT/UPDATE/DELETE hai bảng này. Mọi bảng nghiệp vụ còn lại (điểm danh, bài tập, học phí, nhận xét, `mock_test_results`...) giáo viên SHALL giữ nguyên quyền ghi trong phạm vi của mình.

#### Scenario: Teacher xem lớp của mình
- **WHEN** giáo viên truy vấn danh sách lớp
- **THEN** hệ thống chỉ trả về các lớp có `teacher_id` bằng id của giáo viên đó

#### Scenario: Teacher không thấy dữ liệu giáo viên khác
- **WHEN** giáo viên A cố đọc lớp hoặc học sinh thuộc giáo viên B
- **THEN** hệ thống trả về rỗng, không lộ dữ liệu của B

#### Scenario: Teacher đọc được học sinh và đề kiểm tra trong phạm vi của mình
- **WHEN** giáo viên truy vấn danh sách học sinh hoặc đề Mock Test của lớp được giao
- **THEN** hệ thống trả về đầy đủ dữ liệu để giáo viên xem

#### Scenario: Teacher bị chặn ghi học sinh
- **WHEN** giáo viên cố tạo, sửa hoặc xóa một bản ghi trong bảng `students`
- **THEN** hệ thống từ chối thao tác ghi ở tầng DB

#### Scenario: Teacher bị chặn ghi đề Mock Test
- **WHEN** giáo viên cố tạo, sửa hoặc xóa một bản ghi trong bảng `mock_tests`
- **THEN** hệ thống từ chối thao tác ghi ở tầng DB

#### Scenario: Teacher vẫn nhập được điểm Mock Test
- **WHEN** giáo viên tạo/sửa/xóa kết quả điểm trong bảng `mock_test_results` cho học sinh thuộc lớp được giao
- **THEN** hệ thống cho phép thao tác ghi thành công

#### Scenario: Teacher ghi dữ liệu nghiệp vụ khác trong phạm vi của mình
- **WHEN** giáo viên tạo/sửa/xóa điểm danh, bài tập, nhận xét trong lớp được giao
- **THEN** hệ thống cho phép thao tác ghi thành công

#### Scenario: Teacher bị chặn ghi dữ liệu của người khác
- **WHEN** giáo viên A cố tạo/sửa/xóa bản ghi gắn với lớp/học sinh của giáo viên B
- **THEN** hệ thống từ chối thao tác ghi ở tầng DB

#### Scenario: Truy cập bảng con suy ra qua lớp/học sinh
- **WHEN** giáo viên đọc điểm danh, bài tập, học phí, nhận xét
- **THEN** hệ thống chỉ trả về bản ghi gắn với lớp được giao hoặc học sinh thuộc về giáo viên đó

## ADDED Requirements

### Requirement: UI ẩn thao tác ghi học sinh và đề Mock Test với teacher
Giao diện SHALL ẩn hoặc vô hiệu hóa mọi điều khiển tạo/sửa/xóa học sinh và tạo/sửa/xóa đề Mock Test khi người dùng hiện tại không phải admin (`is_admin = false`), khớp với giới hạn RLS ở tầng DB. Luồng ghi danh học sinh vào lớp SHALL KHÔNG cho giáo viên tạo học sinh mới — giáo viên chỉ gắn học sinh đã tồn tại vào lớp. Các thao tác giáo viên vẫn được phép (nhập điểm Mock Test, điểm danh, bài tập, đổi trạng thái/sửa enrollment) SHALL vẫn hiển thị bình thường.

#### Scenario: Giáo viên không thấy nút thêm/sửa/xóa học sinh
- **WHEN** một giáo viên (không phải admin) mở trang Danh bạ học viên hoặc tab Học Viên trong lớp
- **THEN** giao diện không hiển thị nút thêm nhanh, "Thêm học sinh", "Import Excel", "Xóa hàng loạt", cũng như nút sửa/xóa thông tin học sinh

#### Scenario: Giáo viên không tạo được học sinh mới khi ghi danh
- **WHEN** một giáo viên ghi danh học sinh vào lớp
- **THEN** giao diện chỉ cho chọn học sinh đã tồn tại, không cung cấp lối tạo học sinh mới

#### Scenario: Giáo viên không thấy nút tạo/sửa/xóa đề Mock Test
- **WHEN** một giáo viên mở tab Mock Test của lớp
- **THEN** giao diện không hiển thị nút "Tạo Mock Test mới" và nút sửa/xóa đề, nhưng vẫn hiển thị chức năng nhập điểm

#### Scenario: Admin thấy đầy đủ thao tác
- **WHEN** một admin mở các trang trên
- **THEN** giao diện hiển thị đầy đủ nút thêm/sửa/xóa học sinh và tạo/sửa/xóa đề Mock Test
