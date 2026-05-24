## ADDED Requirements

### Requirement: PaymentModal — modal ghi nhận thanh toán học phí
The system SHALL provide a `PaymentModal` component dùng để tạo/sửa một Payment.

Fields:
- Học viên (select, search được, bắt buộc)
- Số tiền (number input, bắt buộc, > 0, format theo VND có dấu phẩy ngàn)
- Ngày đóng (date input, default = hôm nay, bắt buộc)
- Hình thức (radio: Tiền mặt / Chuyển khoản, bắt buộc)
- Tháng áp dụng (month picker `YYYY-MM`, default = tháng của ngày đóng)
- Ghi chú (textarea, optional)

Style: dùng design system navy/white hiện có, button primary `navy-800`, icon từ `lucide-react`.

#### Scenario: Validate khi submit
- **WHEN** user submit thiếu field bắt buộc hoặc số tiền ≤ 0
- **THEN** hiện inline error tại field tương ứng, không đóng modal

#### Scenario: Submit thành công
- **WHEN** form hợp lệ và user submit
- **THEN** Payment được lưu, modal đóng, toast success "Đã ghi nhận thanh toán"

### Requirement: FeesTable — bảng thu học phí theo tháng
The system SHALL provide a `FeesTable` component hiển thị danh sách học viên với trạng thái thanh toán của tháng đang chọn.

Columns:
- Tên (sort được)
- Lớp
- Học phí kỳ vọng (computed: ví dụ số buổi × `feePerSession`)
- Đã đóng (tổng amount Payment trong period)
- Trạng thái (badge: "Đã đóng" `green`, "Còn nợ" `red`, "Đóng một phần" `amber`)
- Thao tác (icon button: xem lịch sử, ghi nhận thêm)

#### Scenario: Sort theo cột Tên
- **WHEN** user click header "Tên"
- **THEN** rows sort A→Z, click lần nữa sort Z→A

#### Scenario: Badge trạng thái
- **WHEN** `đã đóng = 0`
- **THEN** badge "Còn nợ" màu đỏ
- **WHEN** `đã đóng >= học phí kỳ vọng`
- **THEN** badge "Đã đóng" màu xanh
- **WHEN** `0 < đã đóng < học phí kỳ vọng`
- **THEN** badge "Đóng một phần" màu vàng

### Requirement: SubmissionTable — bảng nộp bài × học viên
The system SHALL provide a `SubmissionTable` component cho View B của HomeworkTab.

Columns:
- Tên học viên
- Đã nộp (checkbox)
- Điểm (number input, 0–10, step 0.25)
- Nhận xét (text input hoặc small textarea)
- Cập nhật lúc (timestamp, formatted)

Behavior:
- Auto-save on blur hoặc on toggle checkbox (debounce 300ms cho text inputs).
- Indicator "đã lưu" nhỏ xuất hiện 1.5s sau khi save thành công.
- Highlight row chưa nộp (background `red-50` hoặc tương đương).

#### Scenario: Auto-save khi blur khỏi ô điểm
- **WHEN** user nhập điểm và blur
- **THEN** Submission upsert, indicator "đã lưu" hiện trên row

#### Scenario: Highlight chưa nộp
- **WHEN** row có `submitted = false`
- **THEN** row có background nhạt màu cảnh báo

### Requirement: ReportCard — card báo cáo trên ReportsPage
The system SHALL provide a generic `ReportCard` component, mỗi card chứa: tiêu đề, vùng filter, chart area (Chart.js), data table phụ (optional), 2 button "Xuất Excel" và "Xuất PDF".

#### Scenario: Layout card
- **WHEN** ReportsPage render
- **THEN** 3 card được hiển thị dạng grid responsive (1 cột mobile, 2-3 cột desktop)

#### Scenario: Loading state
- **WHEN** card đang tính toán/group data
- **THEN** hiện skeleton hoặc spinner thay cho chart

### Requirement: ExportButtons — nút xuất Excel/PDF
The system SHALL provide reusable `ExportExcelButton` và `ExportPdfButton` (hoặc 1 component `ExportButtons` chứa cả 2).

- `ExportExcelButton` nhận props `{ rows, columns, filename }`, dùng `xlsx` để build sheet và trigger download.
- `ExportPdfButton` nhận props `{ targetRef, filename }`, dùng `html2canvas` chụp DOM của `targetRef` rồi build PDF qua `jspdf` và trigger download tự động.

#### Scenario: Disable khi không có data
- **WHEN** `rows` rỗng hoặc card chưa có data
- **THEN** nút xuất disabled, có tooltip "Chưa có dữ liệu để xuất"

#### Scenario: Filename có timestamp
- **WHEN** user bấm export
- **THEN** file tải về có dạng `<filename>-<YYYY-MM-DD>.<ext>`

## MODIFIED Requirements

### Requirement: Navbar items
The Navbar SHALL hiển thị các mục theo thứ tự: Dashboard, Điểm Danh, Học Phí, **Báo Cáo**, Nhận Xét, Lịch Dạy, Lớp Học. Mục "Báo Cáo" mới được chèn sau "Học Phí".

Style nhất quán: icon `lucide-react`, active state dùng `navy-800` background + white text, inactive `navy-400` icon.

#### Scenario: Render đủ mục
- **WHEN** app load
- **THEN** Navbar render 7 mục chính trên, "Báo Cáo" sau "Học Phí"

#### Scenario: Active highlight
- **WHEN** route hiện tại là `/reports`
- **THEN** mục "Báo Cáo" có background `navy-800`, các mục khác không active
