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

### Requirement: FeesPage xuất Excel bảng học phí tháng
`FeesPage` SHALL cung cấp nút xuất Excel cho bảng học phí tháng hiện tại, tái dùng `ExportExcelButton`. Dữ liệu xuất SHALL theo bộ lọc trạng thái đang áp dụng, gồm các cột Học sinh, Lớp, Phải đóng, Đã đóng, Còn nợ, Trạng thái. Tên file kèm tháng/năm.

#### Scenario: Xuất Excel theo bộ lọc
- **WHEN** giáo viên đang lọc "Còn nợ" và bấm xuất Excel
- **THEN** trình duyệt tải file `.xlsx` chỉ chứa các học sinh còn nợ của tháng hiện tại, tên file dạng `hoc-phi-thang-{M}-{YYYY}-{date}.xlsx`

### Requirement: FeesPage lọc theo lớp
`FeesPage` SHALL cung cấp bộ chọn lớp cho phép lọc bảng học phí tháng hiện tại theo một lớp cụ thể hoặc tất cả các lớp. Danh sách lớp SHALL được suy ra từ các giá trị `className` duy nhất trong dữ liệu học phí của tháng đang xem (`buildFeesRows`), kèm tùy chọn "Tất cả lớp" làm mặc định. Bộ lọc lớp SHALL áp dụng client-side và kết hợp (giao) với bộ lọc trạng thái thanh toán hiện có; dữ liệu xuất Excel SHALL phản ánh cả hai bộ lọc đang áp dụng.

#### Scenario: Chọn một lớp cụ thể
- **WHEN** giáo viên chọn một lớp trong bộ chọn lớp
- **THEN** bảng học phí chỉ hiển thị học viên thuộc lớp đó, và các thẻ/bộ đếm trạng thái thanh toán phản ánh tập học viên đã lọc

#### Scenario: Chọn "Tất cả lớp"
- **WHEN** giáo viên chọn "Tất cả lớp" (mặc định)
- **THEN** bảng học phí hiển thị học viên của mọi lớp trong tháng

#### Scenario: Kết hợp lọc lớp và trạng thái thanh toán
- **WHEN** giáo viên chọn một lớp và đồng thời chọn bộ lọc trạng thái "Còn nợ"
- **THEN** bảng chỉ hiển thị học viên thuộc lớp đó và đang còn nợ

#### Scenario: Xuất Excel theo lớp đã lọc
- **WHEN** giáo viên đã chọn một lớp rồi bấm xuất Excel
- **THEN** file xuất chỉ chứa học viên thuộc lớp đang lọc (đồng thời theo trạng thái thanh toán đang chọn)

### Requirement: FeesPage không còn là placeholder
The FeesPage SHALL replace nội dung placeholder bằng module quản lý thu học phí đầy đủ như mô tả ở Requirement "FeesPage — danh sách thu học phí".

#### Scenario: Mở tab Học Phí
- **WHEN** user vào tab "Học Phí"
- **THEN** thấy bảng thu học phí tháng hiện tại, không thấy placeholder cũ

---

## StudentsDirectoryPage — Danh Bạ Học Viên

### Requirement: StudentsDirectoryPage xuất Excel danh sách đang hiển thị
`StudentsDirectoryPage` SHALL cung cấp nút xuất Excel cho danh sách học sinh đang hiển thị sau khi đã áp dụng lọc và tìm kiếm, gồm các cột Họ tên, Khối, SĐT, Email, Lớp, Trạng thái. Tái dùng `ExportExcelButton`.

#### Scenario: Xuất danh sách đã lọc
- **WHEN** giáo viên đã lọc/tìm kiếm và bấm "Xuất Excel"
- **THEN** trình duyệt tải file `.xlsx` chỉ chứa các học sinh đang hiển thị theo bộ lọc/tìm kiếm hiện tại

---

## ReportsPage — Dashboard Báo Cáo

### Requirement: ReportsPage — dashboard báo cáo
The system SHALL add a top-level route/tab "Báo Cáo" (`ReportsPage`) hiển thị các card báo cáo, mỗi card có nút xuất Excel và xuất PDF. `ReportsPage` SHALL cung cấp một **bộ chọn lớp chung ở đầu trang** áp dụng cho tất cả biểu đồ; từng card KHÔNG còn selector lớp riêng (filter khoảng tháng / chọn học viên có thể giữ ở card khi mang tính cục bộ).

Các card:
1. **Điểm Danh theo tháng**: line/bar chart tỉ lệ có mặt theo từng học viên hoặc lớp, theo lớp đang chọn + khoảng tháng.
2. **Tiến độ Mock Test**: line chart điểm Mock Test theo thời gian cho lớp đang chọn, hiển thị **toàn bộ học sinh** (không giới hạn 5), dùng legend để ẩn/hiện series.
3. **Tổng thu Học Phí**: bar chart tổng thu theo tháng + bảng "Học viên còn nợ".
4. **Tiến độ Bài Tập**: chart số bài nộp / số bài giao theo thời gian cho lớp đang chọn.

#### Scenario: Đổi lớp chung
- **WHEN** user đổi lớp ở bộ chọn lớp chung đầu trang
- **THEN** tất cả các card báo cáo refresh theo lớp mới

#### Scenario: Đổi filter cục bộ trong card
- **WHEN** user đổi filter cục bộ (khoảng tháng/học viên) trong 1 card
- **THEN** chart và data trong card đó refresh, các card khác không bị ảnh hưởng

#### Scenario: Mock Test hiển thị toàn bộ học sinh
- **WHEN** lớp đang chọn có nhiều hơn 5 học sinh
- **THEN** card Mock Test render series cho tất cả học sinh (có thể ẩn/hiện qua legend), không cắt cứng còn 5

#### Scenario: Xuất Excel
- **WHEN** user bấm "Xuất Excel" ở 1 card
- **THEN** trình duyệt download file `.xlsx` với data hiện tại của card đó, tên file dạng `bao-cao-<loai>-<YYYY-MM-DD>.xlsx`

#### Scenario: Xuất PDF
- **WHEN** user bấm "Xuất PDF" ở 1 card
- **THEN** trình duyệt download file `.pdf` snapshot card đó (gồm chart + data), tên file dạng `bao-cao-<loai>-<YYYY-MM-DD>.pdf`

#### Scenario: Empty state cho Mock Test khi <2 mốc dữ liệu
- **WHEN** lớp filter có ít hơn 2 lần Mock Test
- **THEN** card hiện hint "Cần ít nhất 2 mốc Mock Test để vẽ tiến độ", disable nút xuất

### Requirement: ReportsPage có biểu đồ tiến độ bài tập
`ReportsPage` SHALL hiển thị một card "Tiến độ Bài Tập" vẽ số bài nộp so với số bài giao theo thời gian cho lớp đang chọn, dùng `homeworkService`/`hwAssignmentService`/`submissionService`, kèm nút xuất Excel/PDF và empty state khi lớp chưa có bài tập.

#### Scenario: Lớp có bài tập
- **WHEN** lớp đang chọn có bài tập đã giao
- **THEN** card hiển thị biểu đồ số bài nộp / số bài giao theo thời gian

#### Scenario: Lớp chưa có bài tập
- **WHEN** lớp đang chọn chưa có bài tập nào
- **THEN** card hiển thị empty state

### Requirement: Biểu đồ ReportsPage hỗ trợ drill-down chi tiết
Các biểu đồ trên `ReportsPage` SHALL hỗ trợ click vào một phần tử (vd cột của một tháng) để mở bảng chi tiết tương ứng trong `Modal`. Dữ liệu chi tiết SHALL được tính/truy vấn khi mở (lazy), không tính sẵn cho mọi phần tử.

#### Scenario: Drill-down từ biểu đồ điểm danh
- **WHEN** user click vào cột của một tháng trong card Điểm Danh
- **THEN** một modal mở ra hiển thị bảng chi tiết buổi học và trạng thái từng học sinh trong tháng đó

#### Scenario: Drill-down từ biểu đồ học phí
- **WHEN** user click vào cột của một tháng trong card Tổng thu Học Phí
- **THEN** một modal mở ra hiển thị danh sách học sinh kèm số đã đóng/còn nợ của tháng đó

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

---

## Loading UX — Skeleton & Breadcrumb

### Requirement: Trạng thái tải dùng skeleton trên FeesPage, ReviewsPage và MockTestTab
`FeesPage`, `ReviewsPage` (tất cả panel) và `MockTestTab` trong `ClassDetailPage` SHALL hiển thị `<Skeleton>` từ `@/components/ui` trong khi chờ dữ liệu, thay vì text "Đang tải...".

#### Scenario: FeesPage đang tải
- **WHEN** `FeesPage` đang chờ service trả dữ liệu học phí
- **THEN** trang hiển thị skeleton cho header và bảng, rồi swap sang nội dung khi dữ liệu resolve

#### Scenario: ReviewsPage đang tải
- **WHEN** `ReviewsPage` đang load dữ liệu cho các panel (radar, lịch sử, điểm danh %, bài tập %)
- **THEN** mỗi panel hiển thị skeleton tương ứng, rồi swap sang nội dung khi resolve

#### Scenario: MockTestTab đang tải
- **WHEN** `MockTestTab` đang load danh sách mock test
- **THEN** sidebar học sinh và vùng nội dung hiển thị skeleton, rồi swap sang nội dung khi resolve

---

### Requirement: ClassDetailPage có breadcrumb điều hướng trở lại rõ ràng
`ClassDetailPage` SHALL hiển thị breadcrumb "Lớp học / {tên lớp}" ở header, trong đó phần "Lớp học" click được để quay về danh sách lớp, hoạt động bất kể trang được mở từ đâu (Dashboard, Schedule hay danh sách lớp).

#### Scenario: Quay lại từ ClassDetailPage mở từ Dashboard
- **WHEN** giáo viên mở một lớp từ Dashboard rồi bấm "Lớp học" trên breadcrumb
- **THEN** ứng dụng quay về danh sách lớp (`ClassesOverviewPage`)

#### Scenario: Breadcrumb hiển thị tên lớp hiện tại
- **WHEN** giáo viên đang ở `ClassDetailPage`
- **THEN** breadcrumb hiển thị "Lớp học / {tên lớp}" với tên lớp hiện tại

---

## DashboardPage — Lịch Hôm Nay & Stat Học Phí

### Requirement: Dashboard hiển thị card "Lịch hôm nay" có điều hướng tới điểm danh
`DashboardPage` SHALL hiển thị card "Lịch hôm nay" liệt kê các buổi học trong ngày (tên lớp, giờ, số học sinh active). Mỗi buổi SHALL có hành động điều hướng thẳng tới trang điểm danh của lớp đó (`ClassDetailPage` tab Attendance).

#### Scenario: Có buổi học hôm nay
- **WHEN** giáo viên mở Dashboard và hôm nay có buổi học theo lịch
- **THEN** card "Lịch hôm nay" liệt kê từng buổi với tên lớp, giờ và số học sinh active

#### Scenario: Điều hướng tới điểm danh
- **WHEN** giáo viên bấm vào hành động điểm danh của một buổi trong card "Lịch hôm nay"
- **THEN** ứng dụng mở `ClassDetailPage` của lớp đó ở tab Attendance

#### Scenario: Hôm nay không có buổi học
- **WHEN** giáo viên mở Dashboard và hôm nay không có buổi học nào
- **THEN** card "Lịch hôm nay" hiển thị empty state

### Requirement: Dashboard thay stat "Năm học" bằng số HS chưa đóng phí
`DashboardPage` SHALL thay stat card "Năm học" bằng card "HS chưa đóng phí tháng này" hiển thị số học sinh còn nợ học phí của tháng hiện tại, tính bằng cùng công thức học phí mà `FeesPage` dùng. Card SHALL điều hướng tới `FeesPage` khi được bấm.

#### Scenario: Hiển thị số HS chưa đóng phí
- **WHEN** giáo viên mở Dashboard
- **THEN** card hiển thị số học sinh còn nợ học phí của tháng hiện tại thay cho stat "Năm học"

#### Scenario: Điều hướng tới trang học phí
- **WHEN** giáo viên bấm card "HS chưa đóng phí tháng này"
- **THEN** ứng dụng chuyển sang `FeesPage`

---

### Requirement: ReviewsPage không hiển thị panel nhận xét chung
`ReviewsPage` SHALL không còn render panel/tab nhận xét chung (`GeneralCommentPanel`). Service `generalCommentService` và file component SHALL được giữ nguyên, chỉ gỡ phần render khỏi UI.

#### Scenario: Mở ReviewsPage
- **WHEN** giáo viên mở `ReviewsPage`
- **THEN** không có panel/tab nhận xét chung nào được hiển thị

---

## AdminPanelPage & Phân Quyền UI

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

---

## SessionModal — Điền Sẵn Giờ Theo Lịch Lớp

### Requirement: SessionModal điền sẵn giờ theo lịch lớp khi tạo buổi
Khi tạo buổi học mới, `SessionModal` SHALL điền sẵn giờ bắt đầu và giờ kết thúc bằng cách parse `scheduleTime` của lớp (định dạng `"HH:MM-HH:MM"`, ví dụ `"19:00-20:30"`). Nếu `scheduleTime` rỗng hoặc không parse được thành cặp giờ hợp lệ, `SessionModal` SHALL fallback về giá trị mặc định `08:00`/`09:30`. Giáo viên SHALL vẫn chỉnh sửa được giờ sau khi điền sẵn. Chế độ chỉnh sửa buổi học hiện có SHALL tiếp tục dùng giờ đã lưu của buổi, không bị ghi đè.

#### Scenario: Tạo buổi với lịch lớp hợp lệ
- **WHEN** giáo viên mở form tạo buổi học mới cho lớp có `scheduleTime = "19:00-20:30"`
- **THEN** ô giờ bắt đầu hiển thị `19:00` và ô giờ kết thúc hiển thị `20:30`

#### Scenario: Lớp không có lịch giờ hợp lệ
- **WHEN** giáo viên mở form tạo buổi học mới cho lớp có `scheduleTime` rỗng hoặc không đúng định dạng
- **THEN** ô giờ bắt đầu hiển thị `08:00` và ô giờ kết thúc hiển thị `09:30`

#### Scenario: Chỉnh sửa buổi học không bị ghi đè
- **WHEN** giáo viên mở form chỉnh sửa một buổi học đã có giờ riêng
- **THEN** form hiển thị đúng giờ bắt đầu/kết thúc đã lưu của buổi đó, không lấy theo lịch lớp

---

## ReviewForm — Điền Sẵn Từ Mock Test Gần Nhất

### Requirement: ReviewForm điền sẵn điểm và nhận xét từ mock test gần nhất
Khi tạo đánh giá mới, `ReviewForm` SHALL điền sẵn điểm kỹ năng (`scores`) và nhận xét thêm (`remark`) từ mock test gần nhất của học sinh đang được đánh giá, nếu có. Điểm SHALL được map theo tên kỹ năng khớp giữa kết quả mock test và `skillConfig` của lớp; kỹ năng không có điểm tương ứng để trống. Form SHALL hiển thị chỉ báo nguồn dữ liệu dạng badge "Điền từ [tên mock test]" kèm nút xóa để bỏ toàn bộ dữ liệu đã điền sẵn. Chế độ chỉnh sửa đánh giá hiện có SHALL không bị ảnh hưởng (giữ nguyên dữ liệu đang sửa).

#### Scenario: Tạo đánh giá khi học sinh đã có mock test
- **WHEN** giáo viên mở form tạo đánh giá mới cho học sinh đã có ít nhất một kết quả mock test
- **THEN** các ô điểm kỹ năng được điền sẵn theo điểm của mock test gần nhất, ô nhận xét thêm điền sẵn theo nhận xét của kết quả đó, và badge "Điền từ [tên test]" hiển thị

#### Scenario: Xóa dữ liệu đã điền sẵn
- **WHEN** giáo viên bấm nút xóa trên badge nguồn dữ liệu
- **THEN** các ô điểm kỹ năng và nhận xét thêm được làm trống và badge biến mất

#### Scenario: Học sinh chưa có mock test
- **WHEN** giáo viên mở form tạo đánh giá mới cho học sinh chưa có kết quả mock test nào
- **THEN** form mở ở trạng thái trống bình thường, không hiển thị badge nguồn dữ liệu

#### Scenario: Chỉnh sửa đánh giá không bị ghi đè
- **WHEN** giáo viên mở form chỉnh sửa một đánh giá đã có
- **THEN** form hiển thị đúng điểm và nhận xét đã lưu của đánh giá đó, không điền theo mock test
