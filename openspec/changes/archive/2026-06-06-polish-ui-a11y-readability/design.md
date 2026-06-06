## Context

App có design system token-based (`tailwind.config.js` định nghĩa palette `navy`, `src/index.css` định nghĩa lớp component như `.input`, `.stat-label`, `.toast`, `.modal-*`). Thay đổi thuần trình bày + accessibility, không đụng nghiệp vụ. Ràng buộc CLAUDE.md: không hard-code hex trong component, dùng token navy + component `@/components/ui`.

## Goals / Non-Goals

**Goals:**
- Chữ nội dung/nhãn trên nền sáng đạt WCAG AA (4.5:1).
- Modal & Toast có a11y cơ bản (Esc, focus-trap, scroll-lock, role/aria-live), Toast hỗ trợ nhiều thông báo.
- Một kiểu nhãn form duy nhất, dễ đọc tiếng Việt.

**Non-Goals:**
- Không đổi điều hướng mobile (đã tách khỏi phạm vi đợt này).
- Không đổi bố cục trang, luồng nghiệp vụ, hay schema.
- Không thêm thư viện a11y (tự viết focus-trap tối giản).

## Decisions

- **Tương phản — đổi giá trị token thay vì sửa rải rác.** `text-navy-400` được dùng làm chữ ở rất nhiều nơi (inline khắp component). Sửa từng chỗ vừa rủi ro vừa khó bao quát. Thay vào đó **đậm hóa nhẹ `navy-300` và `navy-400` trong `tailwind.config.js` + biến CSS `:root`** để mọi `text-navy-400` đạt tương phản tốt hơn ngay lập tức. Hệ quả: icon inactive cũng đậm hơn chút — chấp nhận được (vẫn phân biệt rõ active/inactive). Giá trị mới đề xuất: `navy-400: #3E73B8` (≈ giữa 400 cũ và 500), `navy-300: #6699CC` (đậm hơn để placeholder dễ thấy nhưng vẫn nhạt hơn chữ). Tinh chỉnh để đạt ≥4.5:1 trên trắng cho navy-400.
  - **Bù trừ:** nơi nào navy-400 dùng trên nền TỐI (sidebar navy-900: `text-navy-300/400` cho mục inactive) sẽ sáng/đậm khác đi — kiểm tra Navbar sau khi đổi; nếu lệch, chỉ chỉnh riêng class ở Navbar (không phụ thuộc token).
  - **Cập nhật token ở 2 nơi đồng bộ:** `tailwind.config.js` (utility classes) và `src/index.css :root` (biến dùng trong CSS thuần như scrollbar/select arrow).
- **Modal a11y — bọc trong `Modal` component dùng chung** (`src/components/ui/index.jsx`): `useEffect` add listener `keydown` (Esc → onClose), set `document.body.style.overflow='hidden'` khi mở và khôi phục khi unmount/đóng; focus-trap tối giản bằng cách focus `modal-box` (tabIndex=-1) khi mở + chặn Tab vòng trong các phần tử focusable. Thêm `role="dialog"`, `aria-modal`, `aria-label={title}`. Vì mọi modal trong app đều đi qua component này → sửa một chỗ, toàn app hưởng.
- **Toast — chuyển sang mảng + context/queue.** Hiện `toast` là singleton gọi `_toastSetState`. Giữ API `toast.success/error/info` (không phải sửa hàng loạt caller), nhưng `ToastContainer` quản một **mảng** toast: mỗi lần gọi push thêm item có `id`, tự xóa sau 3s. Đăng ký setter trong `useEffect`. Thêm `role="alert"` + container `aria-live="polite"`. Stack hiển thị dọc ở bottom-right.
- **Nhãn form — sửa `Input`/`Select` + các form viết tay.** Bỏ `uppercase tracking-wide`, dùng `text-sm font-medium text-navy-700`. Form viết tay (Login/SetPassword/filter) vốn đã dùng style này → chủ yếu cần đảm bảo khớp; điểm cần sửa thực sự là 2 component `Input`/`Select`.

## Risks / Trade-offs

- [Đổi token navy-400/300 ảnh hưởng diện rộng gồm cả icon và nền tối] → Mitigation: build + rà soát trực quan Navbar (nền tối) và vài trang chính; chỉ override cục bộ nếu lệch, không revert token.
- [Focus-trap tự viết có thể chưa phủ mọi edge case] → Mitigation: giữ tối giản (Esc + focus vào box + chặn Tab ra ngoài); đủ cho nhu cầu, không cố hoàn hảo.
- [Scroll-lock với nhiều modal lồng nhau] → App không lồng modal nên bỏ qua; vẫn khôi phục overflow an toàn khi đóng.
- [Toast nhiều item có thể chồng cao nếu spam] → Giới hạn tự xóa sau 3s; có thể cap số lượng hiển thị nếu cần.

## Open Questions

- Có cần cap số toast tối đa hiển thị đồng thời không? Mặc định không cap, tự xóa sau 3s; thêm cap nếu thực tế thấy phiền.
