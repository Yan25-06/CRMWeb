## 1. Tương phản màu chữ (WCAG AA)

- [x] 1.1 Đậm hóa `navy-400` và `navy-300` trong `tailwind.config.js` (giá trị đạt ≥4.5:1 trên nền trắng cho navy-400; navy-300 đậm hơn cho placeholder)
- [x] 1.2 Đồng bộ giá trị mới vào biến `:root` trong `src/index.css`
- [x] 1.3 Rà `.input` placeholder và `.stat-label` trong `src/index.css` — đảm bảo dùng tông đạt tương phản
- [x] 1.4 `npm run build` + rà soát trực quan Navbar (nền navy-900) và 1–2 trang chính; override cục bộ ở Navbar nếu mục inactive bị lệch

## 2. A11y Modal

- [x] 2.1 `src/components/ui/index.jsx` — `Modal`: thêm `useEffect` đóng khi nhấn `Esc`
- [x] 2.2 Khóa scroll nền khi mở (`document.body` overflow hidden), khôi phục khi đóng/unmount
- [x] 2.3 Focus vào `modal-box` khi mở (tabIndex=-1) + focus-trap tối giản (Tab vòng trong modal)
- [x] 2.4 Thêm `role="dialog"`, `aria-modal="true"`, `aria-label={title}`
- [x] 2.5 Kiểm chứng: mở một modal bất kỳ → Esc đóng, nền không cuộn, focus nằm trong modal

## 3. A11y Toast + nhiều toast

- [x] 3.1 `ToastContainer`: quản mảng toast (mỗi item có `id`), tự xóa từng item sau 3s
- [x] 3.2 Giữ nguyên API `toast.success/error/info` (không sửa caller); push item mới vào mảng
- [x] 3.3 Đăng ký setter trong `useEffect` (không gọi khi render)
- [x] 3.4 Thêm `role="alert"` cho mỗi toast + container `aria-live="polite"`; xếp chồng dọc bottom-right
- [x] 3.5 Kiểm chứng: kích hoạt 2 toast liên tiếp → cả hai hiển thị, không mất

## 4. Nhất quán nhãn form

- [x] 4.1 `Input` và `Select` trong `src/components/ui/index.jsx`: đổi nhãn từ `uppercase tracking-wide text-xs` → `text-sm font-medium text-navy-700`
- [x] 4.2 Rà các form viết tay (`LoginPage`, `SetPasswordPage`, bộ lọc) đảm bảo nhãn khớp kiểu mới
- [x] 4.3 Kiểm chứng trực quan: nhãn tiếng Việt có dấu dễ đọc, đồng nhất giữa component và form viết tay

## 5. Đồng bộ tài liệu + build cuối

- [x] 5.1 Cập nhật `CLAUDE.md` (giá trị token navy-300/400 mới, kiểu nhãn form mặc định) và README nếu có bảng token
- [x] 5.2 `npm run build` cuối + smoke test, xác nhận không lỗi
