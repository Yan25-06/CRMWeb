## ADDED Requirements

### Requirement: ClassOverviewTable hiển thị điểm mock test gần nhất và chênh lệch
`ClassOverviewTable` trong `ReviewsPage` SHALL hiển thị thêm 2 cột cho mỗi học sinh: (1) điểm mock test gần nhất (điểm tổng/trung bình của bài mock mới nhất, tính theo cùng công thức `MockTestTab`), và (2) chênh lệch so với bài mock liền trước (▲ tăng màu xanh / ▼ giảm màu đỏ + giá trị). Học sinh chưa có mock test SHALL hiển thị "—"; học sinh chỉ có 1 bài mock SHALL hiển thị "—" ở cột chênh lệch.

#### Scenario: Học sinh có nhiều bài mock
- **WHEN** một học sinh có ≥2 bài mock test
- **THEN** cột điểm gần nhất hiển thị điểm bài mới nhất và cột chênh lệch hiển thị hiệu so với bài liền trước kèm chỉ báo tăng/giảm

#### Scenario: Học sinh chỉ có 1 bài mock
- **WHEN** một học sinh chỉ có 1 bài mock test
- **THEN** cột điểm gần nhất hiển thị điểm bài đó và cột chênh lệch hiển thị "—"

#### Scenario: Học sinh chưa có mock test
- **WHEN** một học sinh chưa có bài mock test nào
- **THEN** cả hai cột hiển thị "—"

### Requirement: MockTestTab có ô tìm kiếm học sinh trong sidebar
Sidebar học sinh trong `MockTestTab` SHALL có ô tìm kiếm lọc danh sách học sinh theo tên, dùng debounce nhất quán với ô tìm kiếm của `ReviewsPage`.

#### Scenario: Tìm kiếm học sinh
- **WHEN** giáo viên gõ tên vào ô tìm kiếm trong sidebar `MockTestTab`
- **THEN** danh sách học sinh lọc xuống còn các tên khớp với từ khóa

#### Scenario: Không có kết quả khớp
- **WHEN** từ khóa không khớp học sinh nào
- **THEN** sidebar hiển thị trạng thái rỗng phù hợp
