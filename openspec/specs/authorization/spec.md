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

### Requirement: Admin tạo và giao lớp
Hệ thống SHALL cho phép admin INSERT lớp và gán/đổi `teacher_id` của lớp. Teacher SHALL chỉ cập nhật nội dung lớp được giao và SHALL KHÔNG đổi `teacher_id` sang giáo viên khác.

#### Scenario: Admin tạo và giao lớp
- **WHEN** admin tạo một lớp và gán cho một giáo viên
- **THEN** hệ thống lưu lớp với `teacher_id` là giáo viên đó, và giáo viên đó thấy lớp trong danh sách của mình

#### Scenario: Teacher không chuyển lớp cho người khác
- **WHEN** giáo viên cố đổi `teacher_id` của lớp mình sang một giáo viên khác
- **THEN** hệ thống từ chối thay đổi quyền sở hữu
