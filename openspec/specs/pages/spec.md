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
