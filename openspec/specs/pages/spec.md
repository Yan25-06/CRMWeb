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

---

## FeesPage — Quản Lý Thu Học Phí

### Requirement: FeesPage — danh sách thu học phí
The FeesPage SHALL hiển thị bảng tổng quan thu học phí theo tháng, cho phép ghi nhận khoản thu, và liệt kê học viên còn nợ.

Layout:
- Header: selector tháng (`YYYY-MM`, default = tháng hiện tại), nút "Ghi nhận thanh toán".
- Card tổng: Tổng thu tháng, Số học viên đã đóng / tổng, Số tiền còn nợ ước tính.
- Bảng học viên (theo lớp): cột Tên, Lớp, Học phí kỳ vọng, Đã đóng, Trạng thái (Đã đóng / Còn nợ / Đóng một phần), Thao tác (xem lịch sử, ghi nhận thêm).

#### Scenario: Chuyển tháng xem
- **WHEN** user đổi selector tháng
- **THEN** bảng load lại Payment có `period = tháng đã chọn`, recompute tổng

#### Scenario: Ghi nhận thanh toán
- **WHEN** user bấm "Ghi nhận thanh toán", chọn học viên, nhập số tiền, ngày, hình thức (tiền mặt/chuyển khoản), tháng áp dụng
- **THEN** modal validate (số tiền > 0, học viên không rỗng), submit tạo Payment, đóng modal, toast success, bảng refresh

#### Scenario: Xem lịch sử thanh toán của học viên
- **WHEN** user bấm "xem lịch sử" ở 1 row
- **THEN** mở panel/modal liệt kê tất cả Payment của học viên đó, sort theo `paidAt` desc

#### Scenario: Empty state
- **WHEN** không có Payment nào trong tháng
- **THEN** hiện empty state với CTA "Ghi nhận thanh toán đầu tiên"

### Requirement: FeesPage không còn là placeholder
The FeesPage SHALL replace nội dung placeholder bằng module quản lý thu học phí đầy đủ như mô tả ở Requirement "FeesPage — danh sách thu học phí".

#### Scenario: Mở tab Học Phí
- **WHEN** user vào tab "Học Phí"
- **THEN** thấy bảng thu học phí tháng hiện tại, không thấy placeholder cũ

---

## ReportsPage — Dashboard Báo Cáo

### Requirement: ReportsPage — dashboard báo cáo
The system SHALL add a top-level route/tab "Báo Cáo" (`ReportsPage`) hiển thị 3 card báo cáo, mỗi card có nút xuất Excel và xuất PDF.

3 card:
1. **Điểm Danh theo tháng**: line/bar chart tỉ lệ có mặt theo từng học viên hoặc lớp, filter theo lớp + khoảng tháng.
2. **Tiến độ Mock Test**: line chart điểm Mock Test theo thời gian, filter theo học viên hoặc lớp.
3. **Tổng thu Học Phí**: bar chart tổng thu theo tháng + bảng "Học viên còn nợ".

#### Scenario: Đổi filter
- **WHEN** user đổi filter (lớp/học viên/khoảng tháng) trong 1 card
- **THEN** chart và data trong card đó refresh, các card khác không bị ảnh hưởng

#### Scenario: Xuất Excel
- **WHEN** user bấm "Xuất Excel" ở 1 card
- **THEN** trình duyệt download file `.xlsx` với data hiện tại của card đó, tên file dạng `bao-cao-<loai>-<YYYY-MM-DD>.xlsx`

#### Scenario: Xuất PDF
- **WHEN** user bấm "Xuất PDF" ở 1 card
- **THEN** trình duyệt download file `.pdf` snapshot card đó (gồm chart + data), tên file dạng `bao-cao-<loai>-<YYYY-MM-DD>.pdf`

#### Scenario: Empty state cho Mock Test khi <2 mốc dữ liệu
- **WHEN** học viên/lớp filter có ít hơn 2 lần Mock Test
- **THEN** card hiện hint "Cần ít nhất 2 mốc Mock Test để vẽ tiến độ", disable nút xuất

---

## HomeworkTab trong ClassDetailPage

### Requirement: HomeworkTab trong ClassDetailPage hỗ trợ nộp bài và chấm điểm
The HomeworkTab inside ClassDetailPage SHALL hiển thị danh sách bài tập của lớp **và** khi chọn 1 bài tập, hiện bảng nộp bài × học viên với cột trạng thái nộp, điểm, nhận xét.

Layout 2 view:
- **View A (default):** Danh sách Homework của lớp (mỗi row: title, ngày giao, due date, tỉ lệ đã nộp X/Y). Nút "Thêm bài tập".
- **View B:** Khi click 1 Homework → hiện bảng học viên của lớp với các cột: Tên, Đã nộp (checkbox), Điểm (input 0–10), Nhận xét (textarea/input), Cập nhật lúc. Có nút quay lại View A.

`HomeworkSummaryFooter.jsx` SHALL hiển thị summary cho View B: số đã nộp / tổng, điểm trung bình.

#### Scenario: Thêm bài tập
- **WHEN** user bấm "Thêm bài tập" và submit form với `title` không rỗng
- **THEN** Homework mới được tạo, View A refresh

#### Scenario: Default `dueDate` khi mở form
- **WHEN** user mở form "Thêm bài tập"
- **THEN** field `dueDate` được prefill = `assignedAt + 7 ngày`, user có thể chỉnh hoặc bấm "Xóa hạn nộp" để clear

#### Scenario: Tạo bài tập không có dueDate
- **WHEN** user clear `dueDate` rồi submit
- **THEN** Homework được lưu với `dueDate = undefined`, báo cáo "quá hạn" bỏ qua bài này

#### Scenario: Chọn bài tập để chấm
- **WHEN** user click 1 Homework ở View A
- **THEN** chuyển sang View B với danh sách học viên của lớp, prefill từ Submission đã có

#### Scenario: Đánh dấu đã nộp
- **WHEN** user tick checkbox "Đã nộp" trên 1 row
- **THEN** upsert Submission với `submitted = true`, không cần lưu thủ công

#### Scenario: Nhập điểm và nhận xét
- **WHEN** user nhập điểm (0–10) và/hoặc nhận xét, blur khỏi ô
- **THEN** upsert Submission với field tương ứng, `gradedAt = Date.now()`, hiện indicator "đã lưu"

#### Scenario: Validate điểm
- **WHEN** user nhập điểm ngoài khoảng 0–10
- **THEN** ô input hiện lỗi, không lưu cho đến khi giá trị hợp lệ

#### Scenario: Footer summary
- **WHEN** đang ở View B
- **THEN** HomeworkSummaryFooter hiện "Đã nộp X/Y · Điểm TB: Z.Z" tính realtime từ Submission của bài tập đó

---

## Navbar

### Requirement: Navbar bổ sung mục "Báo Cáo"
The Navbar SHALL include a new top-level item "Báo Cáo" routed to `ReportsPage`, placed sau mục "Học Phí".

Thứ tự navbar: Dashboard, Điểm Danh, Học Phí, **Báo Cáo**, Nhận Xét, Lịch Dạy, Lớp Học.

#### Scenario: Click vào Báo Cáo
- **WHEN** user bấm mục "Báo Cáo" trên navbar
- **THEN** route chuyển sang ReportsPage, mục được highlight active

#### Scenario: Active highlight
- **WHEN** route hiện tại là `/reports`
- **THEN** mục "Báo Cáo" có background `navy-800`, các mục khác không active

---

## ClassModal — Cấu Hình Bộ Kỹ Năng

### Requirement: ClassModal cấu hình bộ kỹ năng của lớp
Form tạo/sửa lớp (`ClassModal`) SHALL cho phép giáo viên định nghĩa bộ kỹ năng của lớp (tên + điểm tối đa + thứ tự) dùng lại trình builder của mock test (`MockTestSectionBuilder`). Khi không chỉnh, lớp SHALL dùng bộ kỹ năng IELTS mặc định.

#### Scenario: Tạo lớp với bộ kỹ năng mặc định
- **WHEN** giáo viên tạo lớp mà không chỉnh phần kỹ năng
- **THEN** lớp được lưu với 4 kỹ năng IELTS (Listening/Reading/Writing/Speaking) thang 0–9

#### Scenario: Tùy chỉnh bộ kỹ năng
- **WHEN** giáo viên thêm/xóa/đổi tên kỹ năng hoặc đổi điểm tối đa rồi lưu lớp
- **THEN** `skillConfig` của lớp được cập nhật và áp dụng cho đánh giá lẫn mock test của lớp

---

## ReviewForm — Ô Nhập Điểm Động

### Requirement: ReviewForm render ô nhập điểm động theo cấu hình lớp
Form đánh giá (`ReviewForm`) SHALL render các ô nhập điểm theo `skillConfig` của lớp thay vì 4 kỹ năng cố định, và validate mỗi điểm trong khoảng `0..maxScore` của kỹ năng tương ứng.

#### Scenario: Hiển thị đúng các kỹ năng của lớp
- **WHEN** mở form đánh giá cho một lớp có bộ kỹ năng tùy chỉnh
- **THEN** form hiển thị đúng các ô nhập điểm theo tên và số lượng kỹ năng của lớp

#### Scenario: Validate theo điểm tối đa từng kỹ năng
- **WHEN** giáo viên nhập điểm vượt `maxScore` của một kỹ năng
- **THEN** form báo lỗi và không lưu cho tới khi điểm hợp lệ

---

## RadarChartPanel — Trục Động & Chuẩn Hóa

### Requirement: Biểu đồ năng lực vẽ trục động và chuẩn hóa điểm
`RadarChartPanel` SHALL vẽ các trục theo `skillConfig` của lớp và chuẩn hóa điểm về phần trăm (`value / maxScore * 100`) để các kỹ năng khác thang điểm vẫn so sánh được trên cùng biểu đồ.

#### Scenario: Trục biểu đồ khớp kỹ năng của lớp
- **WHEN** xem biểu đồ năng lực của học viên trong một lớp tùy chỉnh kỹ năng
- **THEN** các trục radar khớp đúng các kỹ năng trong `skillConfig` của lớp

#### Scenario: Chuẩn hóa điểm khác thang
- **WHEN** các kỹ năng có `maxScore` khác nhau
- **THEN** biểu đồ vẽ theo phần trăm trên trục 0–100 và tooltip hiển thị cả điểm gốc lẫn phần trăm

---

## MockTestModal — Kế Thừa Cấu Hình Kỹ Năng

### Requirement: MockTestModal kế thừa cấu hình kỹ năng của lớp
Khi tạo mock test mới, `MockTestModal` SHALL khởi tạo `sections` mặc định từ `skillConfig` của lớp (tên + điểm tối đa), thay cho bộ section cố định; giáo viên vẫn SHALL chỉnh được trước khi lưu.

#### Scenario: Section mặc định theo kỹ năng của lớp
- **WHEN** giáo viên mở form tạo mock test mới cho một lớp
- **THEN** danh sách `sections` được điền sẵn theo `skillConfig` của lớp đó

#### Scenario: Giáo viên chỉnh section trước khi lưu
- **WHEN** giáo viên thêm/sửa/xóa section sau khi đã điền sẵn từ cấu hình lớp
- **THEN** mock test lưu theo sections đã chỉnh, không bị ghi đè bởi cấu hình lớp
