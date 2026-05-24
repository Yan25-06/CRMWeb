## ADDED Requirements

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

### Requirement: Navbar bổ sung mục "Báo Cáo"
The Navbar SHALL include a new top-level item "Báo Cáo" routed to `ReportsPage`, placed sau mục "Học Phí".

#### Scenario: Click vào Báo Cáo
- **WHEN** user bấm mục "Báo Cáo" trên navbar
- **THEN** route chuyển sang ReportsPage, mục được highlight active

## MODIFIED Requirements

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

### Requirement: FeesPage không còn là placeholder
The FeesPage SHALL replace nội dung placeholder bằng module quản lý thu học phí đầy đủ như mô tả ở Requirement "FeesPage — danh sách thu học phí".

#### Scenario: Mở tab Học Phí
- **WHEN** user vào tab "Học Phí"
- **THEN** thấy bảng thu học phí tháng hiện tại, không thấy placeholder cũ
