# Spec: UI Design System

## Design Tokens

### Màu Navy/White
```
navy-950: #06142B  — backgrounds tối nhất
navy-900: #0F2044  — sidebar, header
navy-800: #1B3A6B  — primary buttons
navy-700: #234D8A  — hover trên navy-800
navy-600: #2E5FA3  — accents, links
navy-500: #3B72BD  — secondary accents
navy-400: #5A8ECC  — icons inactive
navy-300: #7FAADA  — borders subtle
navy-200: #AACAE8  — borders medium
navy-100: #D4E6F5  — backgrounds teal nhạt
navy-50:  #E8EEF7  — hover state backgrounds
white:    #FFFFFF  — card surfaces, inputs
surface:  #F5F8FC  — page background
```

### Typography
```
font-display: "Plus Jakarta Sans" — headings, stat values
font-body:    "Plus Jakarta Sans"          — body text, UI labels
font-mono:    "JetBrains Mono"   — code, IDs
```

### Semantic Colors
```
success:     #0D7A55 / bg: #E6F5EF
warning:     #B45309 / bg: #FEF3C7
danger:      #B91C1C / bg: #FEE2E2
```

## Component Specs

### Requirement: Button
- MUST có 3 sizes: sm (px-3 py-1.5), md (px-4 py-2), lg (px-5 py-2.5)
- MUST có variants: primary (navy-800), secondary (navy-50), ghost, danger, success
- MUST có active:scale-[0.97] animation
- MUST disabled state với opacity-50

### Requirement: Card
- MUST dùng border border-navy-100 + shadow-navy-sm
- MUST hover:shadow-navy transition
- MUST border-radius: 2xl (16px)

### Requirement: Tương phản màu chữ đọc được
Mọi chữ truyền tải thông tin (nhãn, giá trị, chữ phụ) trên nền trắng/sáng SHALL đạt tỷ lệ tương phản tối thiểu 4.5:1 (WCAG AA cho chữ thường). Các tông quá nhạt (`navy-300`, `navy-400`) SHALL chỉ dùng cho icon trang trí, viền, hoặc placeholder — KHÔNG dùng làm chữ nội dung trên nền sáng.

#### Scenario: Nhãn và chữ phụ trên nền trắng
- **WHEN** một nhãn hoặc dòng chữ phụ hiển thị trên nền trắng/sáng
- **THEN** màu chữ đạt tối thiểu tương phản 4.5:1 (dùng `navy-500` trở lên)

#### Scenario: Tông nhạt chỉ cho trang trí
- **WHEN** dùng `navy-300`/`navy-400`
- **THEN** chỉ áp dụng cho icon trang trí, viền, hoặc placeholder, không phải chữ nội dung

### Requirement: Input
- MUST có focus ring: ring-2 ring-navy-100 + border-navy-500
- MUST có label dạng `text-sm font-medium` (KHÔNG dùng uppercase), màu đạt tương phản đọc được (navy-600 trở lên)
- MUST có error state với border-red-400
- Kiểu nhãn này áp dụng nhất quán cho cả `Input`, `Select` và các form viết tay (Login, SetPassword, bộ lọc)

#### Scenario: Render nhãn
- **WHEN** `Input`/`Select` render với prop `label`
- **THEN** nhãn hiển thị dạng `text-sm font-medium` không in hoa, dễ đọc tiếng Việt có dấu

### Requirement: Modal
- MUST backdrop-blur-sm overlay
- MUST animate-slide-up khi open
- MUST đóng khi click ra ngoài (overlay)
- MUST đóng khi nhấn phím `Esc`
- MUST khóa scroll nền khi mở, khôi phục khi đóng
- MUST đưa focus vào modal khi mở và giữ focus trong modal (focus-trap)
- MUST có `role="dialog"`, `aria-modal="true"` và liên kết tiêu đề (`aria-labelledby` hoặc `aria-label`)
- MUST có header, body, footer sections

#### Scenario: Đóng bằng Esc
- **WHEN** modal đang mở và người dùng nhấn `Esc`
- **THEN** modal đóng lại như khi bấm nút đóng

#### Scenario: Khóa scroll nền
- **WHEN** modal mở
- **THEN** nền phía sau không cuộn được; khi đóng, scroll nền khôi phục

#### Scenario: Quản lý focus
- **WHEN** modal mở
- **THEN** focus chuyển vào modal và phím Tab không đưa focus ra ngoài modal

### Requirement: Toast
- MUST hiển thị ở bottom-right
- MUST tự đóng sau 3 giây
- MUST 3 loại: success (emerald), error (red), info (navy)
- MUST có icon tương ứng
- MUST có thuộc tính `role="alert"` và vùng `aria-live` để screen reader đọc
- MUST hỗ trợ nhiều toast cùng lúc (xếp chồng), toast mới KHÔNG đè mất toast đang hiển thị
- Việc đăng ký cơ chế hiển thị toast MUST đặt trong `useEffect` (không gọi khi render)

#### Scenario: Screen reader đọc thông báo
- **WHEN** một toast xuất hiện
- **THEN** nội dung được công bố qua `aria-live`/`role="alert"`

#### Scenario: Nhiều thông báo liên tiếp
- **WHEN** hai action kích hoạt toast gần nhau
- **THEN** cả hai toast hiển thị (xếp chồng), không thông báo nào bị mất

### Requirement: Navbar
- Desktop: sidebar trái rộng 56 (w-56), background navy-900
- Mobile: top bar + bottom nav 5 items
- Mobile: drawer menu từ trái
- Active state: bg-white/15 text-white
- Inactive state: text-navy-300 hover:text-white
- **Thứ tự items:** Dashboard, Điểm Danh, Học Phí, Báo Cáo, Nhận Xét, Lịch Dạy, Lớp Học
- Icon dùng `lucide-react`, active state dùng `navy-800` background + white text, inactive `navy-400` icon

#### Scenario: Render đủ mục
- **WHEN** app load
- **THEN** Navbar render 7 mục chính trên, "Báo Cáo" sau "Học Phí"

## Layout

### Requirement: App Layout
- Desktop: sidebar cố định bên trái + main content bên phải
- Mobile: top bar sticky + content + bottom nav sticky (pb-24)
- Top bar: chứa month/year picker, sticky z-20
- Content area: p-4 sm:p-6 lg:p-8

### Requirement: Month/Year Picker
- Hiển thị 12 tháng dạng pill buttons trên desktop
- Mobile: chỉ hiện "Tháng X/Y" + prev/next buttons
- Year picker: năm trước / hiện tại / năm sau
- Active month: bg-navy-800 text-white

### Requirement: Hiển thị danh tính giáo viên ưu tiên tên hơn email
Mọi điểm UI hiển thị danh tính của giáo viên đang đăng nhập SHALL ưu tiên `teacher.name` từ `useAuth()`, và chỉ hiển thị email khi chưa có tên. Khi có tên, email MAY hiển thị như thông tin phụ.

#### Scenario: Giáo viên có tên
- **WHEN** `teacher.name` có giá trị
- **THEN** UI hiển thị tên làm danh tính chính (email có thể là dòng phụ)

#### Scenario: Giáo viên chưa có tên
- **WHEN** `teacher.name` rỗng
- **THEN** UI fallback hiển thị email

---

## New Components (tuition-submissions-reports)

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
- **WHEN** `đã đóng = 0` → badge "Còn nợ" màu đỏ
- **WHEN** `đã đóng >= học phí kỳ vọng` → badge "Đã đóng" màu xanh
- **WHEN** `0 < đã đóng < học phí kỳ vọng` → badge "Đóng một phần" màu vàng

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
