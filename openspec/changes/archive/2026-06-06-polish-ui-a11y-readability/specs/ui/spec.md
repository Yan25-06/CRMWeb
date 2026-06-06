## ADDED Requirements

### Requirement: Tương phản màu chữ đọc được
Mọi chữ truyền tải thông tin (nhãn, giá trị, chữ phụ) trên nền trắng/sáng SHALL đạt tỷ lệ tương phản tối thiểu 4.5:1 (WCAG AA cho chữ thường). Các tông quá nhạt (`navy-300`, `navy-400`) SHALL chỉ dùng cho icon trang trí, viền, hoặc placeholder — KHÔNG dùng làm chữ nội dung trên nền sáng.

#### Scenario: Nhãn và chữ phụ trên nền trắng
- **WHEN** một nhãn hoặc dòng chữ phụ hiển thị trên nền trắng/sáng
- **THEN** màu chữ đạt tối thiểu tương phản 4.5:1 (dùng `navy-500` trở lên)

#### Scenario: Tông nhạt chỉ cho trang trí
- **WHEN** dùng `navy-300`/`navy-400`
- **THEN** chỉ áp dụng cho icon trang trí, viền, hoặc placeholder, không phải chữ nội dung

## MODIFIED Requirements

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
