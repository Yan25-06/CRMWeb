## Why

Trang Cài Đặt hiện tại chỉ có 2 ô nhập tên trung tâm và tên giáo viên — không có phân quyền theo role, không có chức năng đổi mật khẩu, và cho phép chỉnh sửa trực tiếp inline mà không cần xác nhận. Cần nâng cấp để phục vụ đầy đủ nhu cầu của cả admin lẫn giáo viên thường.

## What Changes

- **Thêm pattern "edit button"**: mặc định hiển thị read-only, bấm "Chỉnh sửa" mới vào edit mode với nút Lưu/Hủy
- **Thêm section "Tài khoản cá nhân"** (tất cả user): tên hiển thị (ghi vào `teachers.name`), email read-only
- **Thêm section "Đổi Mật Khẩu"** (tất cả user): nhập mật khẩu cũ để xác minh, mật khẩu mới + xác nhận
- **Thêm section "Thông Tin Trung Tâm"** (chỉ admin): tên trung tâm qua `settingsService`
- **BREAKING**: xóa field `teacher_name` khỏi `settingsService` và bảng `settings` — tên giờ lưu tại `teachers.name`
- `SettingsPage` đọc tên từ `useAuth().teacher.name` thay vì `settingsService`

## Capabilities

### New Capabilities

- `settings-profile`: Quản lý thông tin tài khoản cá nhân (tên hiển thị, email) với pattern edit button
- `settings-password`: Đổi mật khẩu với xác minh mật khẩu cũ qua re-authenticate Supabase
- `settings-center`: Cài đặt thông tin trung tâm dành riêng cho admin, cũng dùng pattern edit button

### Modified Capabilities

(none)

## Impact

- `src/pages/SettingsPage.jsx` — viết lại hoàn toàn
- `src/services/settingsService.js` — xóa `teacher_name` / `teacherName` khỏi `fromDB`, `toDB`, `DEFAULT_SETTINGS`
- `src/hooks/useAuth.jsx` — thêm method `updateTeacherName(name)` để ghi `teachers.name` từ Settings
- Supabase `settings` table — cột `teacher_name` không còn dùng (không cần migration drop, chỉ bỏ ở service layer)
