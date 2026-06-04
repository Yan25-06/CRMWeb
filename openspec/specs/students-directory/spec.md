# Spec: Trang Danh Bạ Học Sinh (Students Directory)

## Requirements

### Requirement: Trang danh bạ học sinh tổng
Hệ thống SHALL cung cấp một trang top-level "Học Sinh" (`StudentsDirectoryPage`, route `students`) liệt kê toàn bộ học sinh của giáo viên dưới dạng bảng "Danh bạ học viên", dùng các component dùng chung từ `@/components/ui` để đồng nhất với các trang khác.

#### Scenario: Mở trang danh bạ
- **WHEN** giáo viên chọn mục "Học Sinh" trên Navbar
- **THEN** trang hiển thị bảng tất cả học sinh với các cột Học viên, Trạng thái, Lớp học, Liên hệ (email + SĐT), Mục tiêu, Thao tác

#### Scenario: Trạng thái tải
- **WHEN** trang đang chờ service trả dữ liệu
- **THEN** UI hiển thị skeleton rồi hiển thị bảng khi dữ liệu resolve

#### Scenario: Danh sách rỗng
- **WHEN** giáo viên chưa có học sinh nào
- **THEN** trang hiển thị empty state kèm hành động thêm học sinh

---

### Requirement: Lọc và tìm kiếm học sinh
Trang SHALL hỗ trợ lọc theo trạng thái (Tất cả / Chưa có lớp / Đang học / Tạm ngưng / Đã nghỉ), lọc theo lớp, lọc theo loại khóa (generate từ `course_type` của các lớp), và tìm kiếm theo tên / SĐT / email.

#### Scenario: Lọc theo trạng thái "Chưa có lớp"
- **WHEN** giáo viên chọn tab "Chưa có lớp"
- **THEN** bảng chỉ hiển thị học sinh không có enrollment nào

#### Scenario: Lọc theo lớp
- **WHEN** giáo viên chọn một lớp trong dropdown lọc
- **THEN** bảng chỉ hiển thị học sinh có ghi danh vào lớp đó

#### Scenario: Lọc theo loại khóa
- **WHEN** giáo viên chọn một pill loại khóa
- **THEN** bảng chỉ hiển thị học sinh có ghi danh vào lớp thuộc loại khóa đó, và các pill được sinh ra từ `course_type` thực tế không hardcode

#### Scenario: Tìm kiếm
- **WHEN** giáo viên gõ từ khóa vào ô tìm kiếm
- **THEN** bảng lọc theo tên, SĐT hoặc email khớp với từ khóa

---

### Requirement: Tạo học sinh từ trang danh bạ
Trang SHALL cho phép tạo học sinh qua modal chi tiết (tái dùng `StudentModal`) và qua ô "Thêm nhanh (Tên + Enter)" tạo học sinh chưa xếp lớp. Việc xếp lớp ở trang này SHALL là tùy chọn.

#### Scenario: Thêm nhanh bằng tên
- **WHEN** giáo viên gõ tên vào ô thêm nhanh và nhấn Enter
- **THEN** một học sinh mới được tạo không kèm enrollment và xuất hiện trong danh bạ (tab "Chưa có lớp")

#### Scenario: Thêm chi tiết qua modal
- **WHEN** giáo viên bấm "Thêm học sinh" và lưu form
- **THEN** học sinh được tạo qua `studentService`, UI cập nhật và hiển thị toast thành công

---

### Requirement: Import học sinh hàng loạt từ file Excel
Trang SHALL cho phép import nhiều học sinh từ file Excel (`.xlsx`) qua một modal: đọc file bằng thư viện `xlsx`, ánh xạ các cột theo header (tên, khối, SĐT, email), hiển thị bảng preview kèm validation trước khi ghi, rồi tạo các học sinh qua `studentService`. Import SHALL chỉ tạo hồ sơ học sinh và KHÔNG tự ghi danh vào lớp. Trang SHALL cung cấp file mẫu để đúng định dạng.

#### Scenario: Tải lên và xem preview
- **WHEN** giáo viên chọn một file `.xlsx` hợp lệ
- **THEN** modal hiển thị bảng preview các dòng đọc được với cột tên/khối/SĐT/email và đánh dấu dòng lỗi (thiếu tên)

#### Scenario: Xác nhận import
- **WHEN** giáo viên xác nhận import từ bảng preview
- **THEN** hệ thống tạo các học sinh hợp lệ qua `studentService`, bỏ qua dòng lỗi, và hiển thị tổng kết số dòng thành công / lỗi

#### Scenario: File sai định dạng
- **WHEN** giáo viên chọn file không phải `.xlsx` hoặc không đọc được
- **THEN** modal hiển thị thông báo lỗi và không tạo học sinh nào

#### Scenario: Tải file mẫu
- **WHEN** giáo viên bấm tải file mẫu trong modal import
- **THEN** trình duyệt tải về file `.xlsx` mẫu có đúng các cột header cần thiết

---

### Requirement: Xem chi tiết học sinh và điều hướng tới lớp
Khi chọn một học sinh, trang SHALL hiển thị panel chi tiết gồm thông tin cơ bản (tên, SĐT, email, ghi chú), danh sách các lớp đang ghi danh kèm trạng thái và học phí tháng hiện tại, và nút điều hướng "Đến lớp".

#### Scenario: Mở chi tiết học sinh
- **WHEN** giáo viên bấm vào một dòng học sinh
- **THEN** panel chi tiết hiển thị thông tin cơ bản và danh sách lớp kèm trạng thái + học phí tháng hiện tại

#### Scenario: Điều hướng tới lớp
- **WHEN** giáo viên bấm "Đến lớp" ở một lớp trong panel
- **THEN** ứng dụng chuyển sang `ClassDetailPage` của lớp đó

---

### Requirement: Xóa học sinh hàng loạt
Trang SHALL hỗ trợ chọn nhiều học sinh qua checkbox và xóa hàng loạt, có xác nhận trước khi xóa.

#### Scenario: Chọn và xóa hàng loạt
- **WHEN** giáo viên tích chọn nhiều học sinh và bấm xóa
- **THEN** hệ thống hiển thị xác nhận, sau khi đồng ý sẽ xóa các học sinh đã chọn qua `studentService` và cập nhật bảng
