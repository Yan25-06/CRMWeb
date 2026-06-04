## Context

`useAuth.jsx` cung cấp `completePasswordSetup()` (hiện không nhận tham số) và `teacher` (profile từ bảng `teachers`, có cột `name`). `SetPasswordPage` chỉ có form mật khẩu. `Navbar` đã hiển thị `teacher?.name || user.email` và phụ đề email khi có tên — đúng pattern mong muốn. Row `teachers` được DB trigger tạo khi invite, nhưng `name` rỗng cho tới khi giáo viên nhập. `teacherService` có `update` để ghi profile.

## Goals / Non-Goals

**Goals:**
- Bắt tên hiển thị ngay khi đặt mật khẩu lần đầu và lưu vào `teachers.name`.
- Mọi nơi hiển thị danh tính giáo viên hiện hành ưu tiên tên, fallback email.

**Non-Goals:**
- Không đổi cơ chế invite (vẫn qua Supabase Dashboard + trigger tạo row).
- Không xử lý đổi tên sau này (Settings có thể có sẵn `teacherName` — ngoài scope, chỉ rà soát hiển thị).
- Không đụng hiển thị email của **giáo viên khác** trong Admin Panel (đó là danh sách quản trị, không phải danh tính người đang đăng nhập).

## Decisions

### 1. Thêm input tên vào SetPasswordPage, validate bắt buộc
Form có thêm field "Tên hiển thị" (required, trim không rỗng). Submit gọi `completePasswordSetup(name)`.

### 2. completePasswordSetup nhận name và ghi teachers.name
Mở rộng `completePasswordSetup(name)` trong `useAuth.jsx`: sau khi `supabase.auth.updateUser({ password })` thành công, cập nhật `teachers.name` qua `teacherService.update` cho `user.id`, rồi refresh `teacher` profile trong state. Tránh `await` supabase trong callback `onAuthStateChange` (auth lock) — thực hiện trong handler submit/`useEffect`, không trong listener.

### 3. Hiển thị ưu tiên tên, fallback email — chuẩn hóa
Pattern chuẩn `teacher?.name || user.email` (và phụ đề email khi có tên) như `Navbar` đang dùng. Rà soát các điểm hiển thị danh tính giáo viên hiện hành; nơi nào còn hiện thẳng email thì đổi theo pattern. Cân nhắc helper nhỏ `displayName(teacher, user)` nếu lặp nhiều.

## Risks / Trade-offs

- **Auth lock deadlock** → không await supabase trong `onAuthStateChange`; cập nhật `teachers.name` trong handler submit, nạp lại profile qua `useEffect` theo `user.id` (đúng kiến trúc hiện có).
- **Giáo viên cũ đã onboard không có tên** → vẫn fallback email; có thể đặt tên qua Settings (ngoài scope change này). Không ép migrate.
- **Trùng khái niệm `settings.teacherName` vs `teachers.name`** → chỉ dùng `teacher.name` (bảng `teachers`) làm nguồn cho danh tính đăng nhập; không gộp với settings trong change này.

## Migration Plan

1. Thêm input tên + validate vào `SetPasswordPage`.
2. Mở rộng `completePasswordSetup(name)` ghi `teachers.name` + refresh profile.
3. Rà soát & chuẩn hóa các điểm hiển thị danh tính giáo viên (ưu tiên tên).
4. Rollback: revert UI + chữ ký hàm; không thay đổi DB schema (cột `name` đã có).
