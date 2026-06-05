## ADDED Requirements

### Requirement: Nguồn chân lý phân quyền ở client tập trung
Mọi quyết định ẩn/hiện hoặc cho phép thao tác theo quyền trên giao diện SHALL được suy ra từ một hook tập trung (`usePermissions`) dựa trên `teacher` của người dùng hiện tại, thay vì từng component tự đọc cờ `teachers.is_admin` trực tiếp. Hook SHALL trả về các cờ ngữ nghĩa theo từng năng lực (ví dụ "được xem học phí", "được vào trang admin", "được quản lý học sinh") để component không phải tự diễn dịch từ cờ kỹ thuật. Yêu cầu này SHALL KHÔNG thay thế hay nới lỏng việc enforce quyền thật ở tầng DB (RLS vẫn là nguồn chân lý bảo mật); nó chỉ đảm bảo nhất quán cho lớp UI.

#### Scenario: Cờ phân quyền suy ra từ một nguồn
- **WHEN** một component cần biết người dùng hiện tại có được thực hiện một thao tác có giới hạn quyền hay không
- **THEN** component lấy cờ tương ứng từ hook phân quyền tập trung thay vì tự đọc `teacher.is_admin`

#### Scenario: Nhất quán giữa các màn hình
- **WHEN** cùng một năng lực bị giới hạn quyền được kiểm soát ở nhiều màn hình khác nhau
- **THEN** tất cả màn hình phản ánh cùng một quyết định cho phép/không cho phép vì cùng đọc từ một nguồn

#### Scenario: Người dùng không phải admin
- **WHEN** một giáo viên thường (không phải admin) đăng nhập
- **THEN** hook trả về các cờ quyền quản lý ở trạng thái không cho phép, và UI ẩn các thao tác tương ứng giống như hành vi trước khi refactor

#### Scenario: Admin
- **WHEN** một admin đăng nhập
- **THEN** hook trả về các cờ quyền quản lý ở trạng thái cho phép, và UI hiển thị đầy đủ thao tác giống như hành vi trước khi refactor

#### Scenario: Không đổi quyền thật ở tầng DB
- **WHEN** việc gating ở UI được tập trung qua hook
- **THEN** các RLS policy và quyền ghi/đọc thực tế ở DB không thay đổi
