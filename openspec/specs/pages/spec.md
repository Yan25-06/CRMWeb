# Spec: Quản Lý Học Sinh & Lớp Học

## Requirements

### StudentsPage Layout
- GIVEN user ở tab "Học Sinh"
- Page có 2 tabs: "Học Sinh" và "Lớp Học"
- Header có search input + nút "Thêm học sinh" / "Thêm lớp"
- Default tab: Học Sinh

### Danh sách học sinh
- Hiển thị dạng table với columns: Tên, Lớp, Khối, SĐT, Học phí/buổi, Thao tác
- Tìm kiếm realtime theo tên (debounce 200ms)
- Lọc theo lớp (select dropdown)
- Mỗi row có nút Sửa (icon pencil) và Xóa (icon trash)
- Empty state khi không có học sinh

#### Scenario: Tìm kiếm học sinh
- GIVEN danh sách học sinh
- WHEN user nhập tên vào search
- THEN lọc realtime, không cần submit

#### Scenario: Xóa học sinh
- GIVEN học sinh đang hiển thị
- WHEN user bấm nút Xóa
- THEN hiện confirm dialog
- IF xác nhận → xóa khỏi db + toast success
- IF hủy → không làm gì

### Modal Thêm/Sửa Học Sinh
- Fields: Họ và tên (required), Lớp học (required, select), Khối, SĐT phụ huynh, Học phí/buổi, Ghi chú
- Validation: tên không được rỗng, lớp phải chọn
- Submit → upsert vào db → đóng modal → toast success
- Sửa: prefill tất cả fields từ student object

#### Scenario: Thêm học sinh thành công
- GIVEN modal mở
- WHEN user điền đủ thông tin required và bấm Lưu
- THEN addStudent() gọi → toast "Đã thêm học sinh!" → modal đóng → list refresh

#### Scenario: Validation fail
- GIVEN modal mở
- WHEN user bấm Lưu mà tên rỗng
- THEN hiện error dưới field "Họ và tên là bắt buộc"
- AND không đóng modal

### Danh sách lớp học (Grid View)
- Thay vì dạng table, danh sách lớp học hiển thị dạng Grid các Card.
- Mỗi Card hiển thị:
  - Góc trên bên trái: Tag khóa học (courseType) với màu sắc phù hợp (VD: IELTS xanh, TOEIC cam).
  - Tên lớp (Tiêu đề nổi bật).
  - Lịch học: scheduleDays (Thứ) và scheduleTime (Giờ).
  - Ngày khai giảng: startDate.
  - Sĩ số: Số học sinh / maxStudents.
- Trên Card vẫn có nút Sửa và Xóa, có thể đặt ở menu dropdown (3 chấm) hoặc ở góc card.
- Xóa lớp: warn nếu còn học sinh trong lớp.

### Modal Thêm/Sửa Lớp
- Fields bổ sung: 
  - Tên lớp (required)
  - Khóa học/Phân loại (courseType - select: IELTS, TOEIC, Giao Tiếp...)
  - Trình độ
  - Sĩ số tối đa
  - Lịch học (scheduleDays - string, VD: "Thứ 2-4-6")
  - Giờ học (scheduleTime - string, VD: "19:00-20:30")
  - Ngày khai giảng (startDate - date)
- Validation: tên không được rỗng
