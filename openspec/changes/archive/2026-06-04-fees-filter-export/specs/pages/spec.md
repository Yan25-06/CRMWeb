## ADDED Requirements

### Requirement: FeesPage lọc theo trạng thái thanh toán
`FeesPage` SHALL cung cấp bộ lọc trạng thái thanh toán gồm: Tất cả / Còn nợ / Đã đóng đủ / Đóng một phần, áp dụng client-side trên dữ liệu học phí tháng hiện tại, kèm số đếm cho mỗi nhóm. Trạng thái mỗi học sinh suy ra từ (học phí phải đóng, đã đóng): đóng đủ khi đã đóng ≥ phải đóng; đóng một phần khi 0 < đã đóng < phải đóng; còn nợ khi đã đóng = 0 và phải đóng > 0.

#### Scenario: Lọc "Còn nợ"
- **WHEN** giáo viên chọn bộ lọc "Còn nợ"
- **THEN** bảng chỉ hiển thị học sinh chưa đóng đồng nào trong tháng và còn phải đóng

#### Scenario: Lọc "Đóng một phần"
- **WHEN** giáo viên chọn bộ lọc "Đóng một phần"
- **THEN** bảng chỉ hiển thị học sinh đã đóng một phần nhưng chưa đủ

#### Scenario: Lọc "Đã đóng đủ"
- **WHEN** giáo viên chọn bộ lọc "Đã đóng đủ"
- **THEN** bảng chỉ hiển thị học sinh đã đóng đủ học phí tháng

#### Scenario: Số đếm mỗi nhóm
- **WHEN** `FeesPage` hiển thị bộ lọc
- **THEN** mỗi nhóm hiển thị số học sinh thuộc nhóm đó theo tháng hiện tại

### Requirement: FeesPage xuất Excel/PDF bảng học phí tháng
`FeesPage` SHALL cung cấp nút xuất Excel và PDF cho bảng học phí tháng hiện tại, tái dùng `ExportButtons`. Dữ liệu xuất SHALL theo bộ lọc trạng thái đang áp dụng, gồm các cột Học sinh, Lớp, Phải đóng, Đã đóng, Còn nợ, Trạng thái.

#### Scenario: Xuất Excel theo bộ lọc
- **WHEN** giáo viên đang lọc "Còn nợ" và bấm xuất Excel
- **THEN** trình duyệt tải file `.xlsx` chỉ chứa các học sinh còn nợ của tháng hiện tại

#### Scenario: Xuất PDF
- **WHEN** giáo viên bấm xuất PDF
- **THEN** trình duyệt tạo file PDF của bảng học phí theo bộ lọc đang áp dụng

### Requirement: StudentsDirectoryPage xuất Excel danh sách đang hiển thị
`StudentsDirectoryPage` SHALL cung cấp nút xuất Excel cho danh sách học sinh đang hiển thị sau khi đã áp dụng lọc và tìm kiếm, gồm các cột Họ tên, Khối, SĐT, Email, Lớp, Trạng thái.

#### Scenario: Xuất danh sách đã lọc
- **WHEN** giáo viên đã lọc/tìm kiếm và bấm "Xuất Excel"
- **THEN** trình duyệt tải file `.xlsx` chỉ chứa các học sinh đang hiển thị theo bộ lọc/tìm kiếm hiện tại
