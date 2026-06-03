## Why

Sau cutover (#9), toàn bộ dữ liệu ở Supabase và RLS đã phân tách teacher/admin. Change cuối lộ trình: dựng Admin Panel cho tài khoản `is_admin` — nơi admin tạo & giao lớp cho giáo viên và xem read-only dữ liệu toàn trung tâm. Việc mời giáo viên làm trực tiếp qua Supabase Dashboard (trigger tự tạo row `teachers`), nên Admin Panel không cần Edge Function.

## What Changes

- Thêm route admin (vd `/admin`) chỉ truy cập được khi `teacher.is_admin = true`; `ProtectedRoute` (từ #2) chặn teacher thường.
- Màn admin: danh sách giáo viên (đọc từ `teachers`), tạo lớp + gán/đổi `teacher_id` (dùng `classService` — ngoại lệ ghi của admin đã mở ở RLS #3).
- Xem read-only dữ liệu mọi giáo viên: chọn một giáo viên → xem lớp/học sinh/điểm danh… qua các service hiện có (admin có SELECT-all nhờ RLS); UI ẩn mọi nút sửa/xóa dữ liệu nghiệp vụ.
- Hướng dẫn mời giáo viên qua Supabase Dashboard (Auth → Invite user) — không build luồng invite trong app.

Phạm vi: route admin + tạo/giao lớp + xem read-only. KHÔNG gồm: invite qua Edge Function (làm qua Dashboard), sửa dữ liệu nghiệp vụ bởi admin (cấm ở DB).

## Capabilities

### New Capabilities
- `admin-panel`: Trang quản lý chỉ cho admin; tạo & giao lớp cho giáo viên; xem read-only dữ liệu toàn trung tâm; mời giáo viên thực hiện ngoài app qua Supabase Dashboard.

### Modified Capabilities
<!-- Không có. -->

## Impact

- **Code mới**: route + trang `AdminPanel` (danh sách giáo viên, form tạo/giao lớp, khung xem read-only theo giáo viên); guard admin trong routing.
- **Code dùng lại**: `classService` (tạo/giao lớp), các service đọc khác (xem read-only); `useAuth` cho `is_admin`.
- **Phụ thuộc**: cần #2 (auth + `ProtectedRoute` + `is_admin`) và #9 (mọi service đã sẵn sàng, db.js đã xóa). Là change cuối lộ trình.
- **Rủi ro**: thấp–trung bình — phải đảm bảo admin không vô tình có nút ghi dữ liệu nghiệp vụ (DB đã chặn, nhưng UI cũng nên ẩn để tránh nhầm lẫn).
