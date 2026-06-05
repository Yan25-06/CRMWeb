## Context

`SettingsPage` hiện tại là một card đơn với 2 input inline-editable. `settingsService` lưu `teacher_name` vào bảng `settings` (per-teacher), nhưng tên thực tế được dùng khắp app lại đến từ `teachers.name` qua `useAuth`. Tồn tại sự không đồng nhất giữa hai nguồn dữ liệu này.

Supabase cung cấp `supabase.auth.updateUser({ password })` để đổi mật khẩu và `supabase.auth.signInWithPassword` để re-authenticate xác minh mật khẩu cũ — không cần Edge Function hay backend thêm.

## Goals / Non-Goals

**Goals:**
- Pattern edit button nhất quán: read-only by default → click "Chỉnh sửa" → edit mode → Lưu/Hủy
- Tên hiển thị lưu duy nhất tại `teachers.name`, đồng bộ với `useAuth`
- Đổi mật khẩu với xác minh mật khẩu cũ
- Admin thấy thêm section "Thông Tin Trung Tâm"

**Non-Goals:**
- Upload avatar/logo
- Cài đặt thông báo
- Học phí mặc định, ngày chốt phí
- Migration drop cột `teacher_name` khỏi DB (bỏ ở service layer là đủ)

## Decisions

### D1: Tên hiển thị ghi vào `teachers.name`, không phải `settings.teacher_name`

`teachers.name` là nguồn chân lý được dùng ở Navbar, auth context, Admin Panel. Ghi vào `settings.teacher_name` tạo dữ liệu thừa và nguy cơ lệch nhau.

**Cách làm**: Thêm method `updateTeacherName(name)` vào `useAuth` — gọi `supabase.from('teachers').update({ name })` rồi refresh `teacher` state tại chỗ (không cần reload page).

Thay thế được xét: gọi trực tiếp từ SettingsPage → vi phạm quy ước "không gọi `supabase.*` trong component".

### D2: Xác minh mật khẩu cũ qua re-authenticate

`supabase.auth.updateUser` không yêu cầu mật khẩu cũ, nhưng UX cần nó để ngăn người lạ đổi mật khẩu khi máy đang mở.

**Cách làm**: Gọi `signInWithPassword({ email: user.email, password: oldPassword })` trước — nếu lỗi → báo "Mật khẩu hiện tại không đúng". Nếu thành công → `updateUser({ password: newPassword })`.

### D3: Mỗi section có edit state riêng biệt

Ba section (Tài khoản, Đổi mật khẩu, Thông tin trung tâm) dùng state `editing` độc lập. Tránh trường hợp user đang sửa tên lại bị reset khi bấm Hủy ở section khác.

### D4: `settingsService` — xóa `teacher_name` ở service layer, không migration DB

Cột `teacher_name` trong bảng `settings` để nguyên ở DB (tránh migration không cần thiết). Chỉ xóa khỏi `fromDB`, `toDB`, `DEFAULT_SETTINGS`. Dữ liệu cũ trong cột đó sẽ bị orphan nhưng không gây lỗi.

## Risks / Trade-offs

- **Re-authenticate tạo session mới** → Supabase `signInWithPassword` refresh token, không ảnh hưởng UX nhưng cần test trên production để đảm bảo không gây edge case với `onAuthStateChange`.

- **`updateTeacherName` trong `useAuth` làm hook nặng hơn** → Chấp nhận được vì pattern nhất quán với `completePasswordSetup` đã có trong hook.

## Migration Plan

Không có migration DB. Deploy trực tiếp — các component đã đọc `teacher.name` từ `useAuth` không bị ảnh hưởng.
