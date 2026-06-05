## ADDED Requirements

### Requirement: Navbar ẩn mục "Học Phí" với tài khoản không phải admin
The Navbar SHALL chỉ hiển thị mục "Học Phí" khi tài khoản đăng nhập là admin (`teacher.is_admin = true`). Với giáo viên thường, mục "Học Phí" SHALL bị ẩn khỏi danh sách điều hướng. Các mục khác (Dashboard, Điểm Danh, Báo Cáo, Nhận Xét, Lịch Dạy, Lớp Học) SHALL hiển thị cho mọi tài khoản như hiện tại, bao gồm cả Báo Cáo cho giáo viên.

#### Scenario: Giáo viên không thấy mục Học Phí
- **WHEN** một giáo viên (không phải admin) mở ứng dụng
- **THEN** Navbar không hiển thị mục "Học Phí"

#### Scenario: Admin thấy mục Học Phí
- **WHEN** một admin mở ứng dụng
- **THEN** Navbar hiển thị mục "Học Phí" cùng tất cả mục khác

#### Scenario: Giáo viên vẫn thấy Báo Cáo
- **WHEN** một giáo viên (không phải admin) mở ứng dụng
- **THEN** Navbar vẫn hiển thị mục "Báo Cáo" như trước

### Requirement: FeesPage chỉ admin truy cập
The application SHALL chỉ cho phép admin truy cập route/trang `fees` (FeesPage). Khi một tài khoản không phải admin cố mở trang `fees`, ứng dụng SHALL điều hướng về `dashboard`.

#### Scenario: Giáo viên bị chặn truy cập FeesPage
- **WHEN** tài khoản không phải admin có `page === 'fees'`
- **THEN** ứng dụng hiển thị `DashboardPage` thay vì `FeesPage`

#### Scenario: Admin truy cập FeesPage bình thường
- **WHEN** admin chọn mục "Học Phí"
- **THEN** ứng dụng hiển thị `FeesPage` đầy đủ

### Requirement: Admin Panel hiển thị dải thống kê tổng quan
The AdminPanelPage SHALL hiển thị một dải gồm 4 stat card tổng quan phía trên các phần hiện có, dùng component `StatCard` từ `@/components/ui`: (1) Tổng số học viên, (2) Số lớp đang hoạt động, (3) Số giáo viên, (4) Số học viên chưa đóng phí tháng hiện tại. Số liệu SHALL lấy từ service layer (`studentService`, `classService`, `teacherService`, `feeService`) và dùng cùng công thức học phí mà FeesPage dùng cho chỉ số chưa đóng phí.

#### Scenario: Admin Panel hiển thị stat card
- **WHEN** admin mở Admin Panel
- **THEN** trang hiển thị 4 stat card: Tổng học viên, Lớp đang hoạt động, Số giáo viên, HS chưa đóng phí — phía trên danh sách giáo viên và lớp học

#### Scenario: Chỉ số chưa đóng phí khớp công thức học phí
- **WHEN** Admin Panel tính số HS chưa đóng phí tháng hiện tại
- **THEN** giá trị suy ra bằng cùng công thức học phí mà FeesPage dùng
