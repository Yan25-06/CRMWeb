## MODIFIED Requirements

### Requirement: Admin toàn quyền ghi dữ liệu nghiệp vụ
Hệ thống SHALL cho admin đọc VÀ ghi (INSERT/UPDATE/DELETE) dữ liệu của tất cả giáo viên trên mọi bảng nghiệp vụ — admin hành xử như một giáo viên nhưng KHÔNG bị giới hạn theo `teacher_id`. Quyền ghi này SHALL được enforce ở tầng DB bằng các RLS policy admin độc lập (điều kiện `is_admin()`), tách biệt với policy của teacher và KHÔNG làm thay đổi quyền của teacher.

#### Scenario: Admin xem dữ liệu mọi giáo viên
- **WHEN** admin truy vấn lớp, học sinh, điểm danh của bất kỳ giáo viên nào
- **THEN** hệ thống trả về đầy đủ dữ liệu của tất cả giáo viên

#### Scenario: Admin ghi dữ liệu nghiệp vụ của bất kỳ giáo viên
- **WHEN** admin tạo/sửa/xóa học sinh, điểm danh, bài tập, điểm số, nhận xét, học phí của bất kỳ giáo viên nào
- **THEN** hệ thống cho phép thao tác ghi thành công ở tầng DB

#### Scenario: Admin tạo học sinh và gán cho giáo viên phụ trách
- **WHEN** admin tạo một học sinh và chỉ định giáo viên phụ trách
- **THEN** hệ thống lưu học sinh với `teacher_id` là giáo viên đó, và giáo viên đó thấy học sinh trong danh sách của mình

#### Scenario: Quyền của teacher không đổi
- **WHEN** một giáo viên thao tác đọc/ghi dữ liệu
- **THEN** giáo viên vẫn chỉ truy cập được dữ liệu lớp được giao và học sinh của mình như trước, không bị mở rộng cũng không bị thu hẹp
