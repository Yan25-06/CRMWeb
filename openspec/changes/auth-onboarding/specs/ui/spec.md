## ADDED Requirements

### Requirement: Hiển thị danh tính giáo viên ưu tiên tên hơn email
Mọi điểm UI hiển thị danh tính của giáo viên đang đăng nhập SHALL ưu tiên `teacher.name` từ `useAuth()`, và chỉ hiển thị email khi chưa có tên. Khi có tên, email MAY hiển thị như thông tin phụ.

#### Scenario: Giáo viên có tên
- **WHEN** `teacher.name` có giá trị
- **THEN** UI hiển thị tên làm danh tính chính (email có thể là dòng phụ)

#### Scenario: Giáo viên chưa có tên
- **WHEN** `teacher.name` rỗng
- **THEN** UI fallback hiển thị email
