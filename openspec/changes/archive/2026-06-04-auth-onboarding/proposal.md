## Why

Khi giáo viên accept invite, `SetPasswordPage` chỉ có form đặt mật khẩu — không hỏi tên, nên `teachers.name` rỗng. Hệ quả: dù `Navbar` đã ưu tiên hiển thị `teacher.name` rồi mới đến email (`teacher?.name || user.email`), tên luôn rỗng nên UI luôn hiện email — kém thân thiện và lộ email. D1 (bắt tên lúc onboarding) là gốc rễ để D2 (hiển thị tên thay email) thực sự có tác dụng. Auth flow tách biệt nên gom riêng để test độc lập.

## What Changes

- **D1** `SetPasswordPage`: thêm ô nhập **Tên hiển thị** (bắt buộc) cạnh form mật khẩu. Khi hoàn tất, lưu tên vào `teachers.name` (qua `teacherService`/`completePasswordSetup` nhận `name`) đồng thời với việc đặt mật khẩu.
- **D2** Toàn bộ web: nơi nào đang hiển thị email của giáo viên hiện hành SHALL ưu tiên `teacher.name` từ `useAuth()`, chỉ hiện email khi chưa có tên. `Navbar` đã làm đúng pattern này — rà soát và áp dụng nhất quán ở các chỗ còn lại (Settings, v.v.).

## Capabilities

### Modified Capabilities
- `authentication`: Luồng đặt mật khẩu lần đầu bắt thêm tên hiển thị và lưu vào `teachers.name`.
- `ui`: Các điểm hiển thị danh tính giáo viên hiện hành ưu tiên tên, fallback email.

## Impact

- **UI:** `src/pages/SetPasswordPage.jsx` (thêm input tên), rà soát `src/components/layout/Navbar.jsx` (đã đúng), `src/pages/SettingsPage.jsx` và các chỗ hiện email.
- **Auth:** `src/hooks/useAuth.jsx` — `completePasswordSetup(name)` nhận tên, gọi cập nhật `teachers.name` qua `teacherService` (không gọi `supabase` trực tiếp trong component; cập nhật profile có thể trong hook auth).
- **Data:** ghi `teachers.name` (cột đã tồn tại). Không thêm cột/bảng.
- **Không ảnh hưởng:** data model khác, DB schema, các trang nghiệp vụ.
