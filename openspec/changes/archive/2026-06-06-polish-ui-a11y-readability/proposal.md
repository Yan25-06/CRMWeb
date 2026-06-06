## Why

UI có nền design system tốt nhưng còn ba điểm ảnh hưởng trực tiếp tới người dùng cuối (giáo viên, có thể lớn tuổi, dùng trên màn hình phổ thông): nhiều chữ phụ/nhãn dùng `navy-300/400` trên nền trắng có tương phản dưới ngưỡng WCAG AA (~3:1) nên khó đọc; Modal và Toast thiếu các thuộc tính accessibility cơ bản (Esc, focus-trap, khóa scroll, `role`/`aria-live`) và Toast chỉ hiển thị một thông báo tại một thời điểm; và nhãn form không nhất quán (component `Input/Select` dùng nhãn IN HOA tracking-wide còn các form viết tay dùng nhãn thường).

## What Changes

- **Tương phản & dễ đọc:** Nâng các màu chữ phụ/nhãn nhỏ trên nền trắng đạt tối thiểu WCAG AA cho chữ thường. Giữ `navy-300/400` cho icon trang trí, viền, placeholder ở mức chấp nhận được; chữ nội dung/nhãn chuyển sang tông đậm hơn (navy-500/600 trở lên).
- **A11y Modal:** Thêm đóng bằng phím `Esc`, khóa scroll nền khi mở, focus-trap (focus vào modal khi mở, không tab ra ngoài), và các thuộc tính `role="dialog"` + `aria-modal` + nhãn tiêu đề.
- **A11y Toast + hàng đợi:** Thêm `role="alert"`/`aria-live` để screen reader đọc; cho phép hiển thị nhiều toast xếp chồng thay vì đè mất thông báo trước; chuyển đăng ký state ra `useEffect` thay vì gọi mỗi lần render.
- **Nhất quán nhãn form:** Thống nhất một kiểu nhãn (bỏ uppercase, dùng `text-sm font-medium`) trong component `Input`/`Select` và áp dụng cho các form viết tay (Login, SetPassword, các bộ lọc) để dễ đọc tiếng Việt có dấu.

## Capabilities

### New Capabilities
<!-- không có capability mới; toàn bộ là tinh chỉnh capability UI hiện có -->

### Modified Capabilities
- `ui`: Cập nhật yêu cầu cho `Input` (kiểu nhãn), `Modal` (a11y: Esc/focus-trap/scroll-lock/role), `Toast` (a11y + nhiều toast), và bổ sung yêu cầu mới về tương phản màu chữ tối thiểu (đọc được).

## Impact

- **Code:** `tailwind.config.js` và/hoặc `src/index.css` (token & lớp dùng chung: `stat-label`, `.input`, placeholder), `src/components/ui/index.jsx` (Input, Select, Modal, Toast, ToastContainer), các form viết tay (`src/pages/LoginPage.jsx`, `src/pages/SetPasswordPage.jsx`, các component có nhãn/filter dùng `text-navy-400` làm chữ).
- **Không** đổi schema, service, routing, hay logic nghiệp vụ. Thay đổi thuần trình bày + accessibility.
- **Phụ thuộc:** không thêm package mới.
- Cập nhật `CLAUDE.md` (mục design system) nếu đổi giá trị token hoặc kiểu nhãn mặc định.
