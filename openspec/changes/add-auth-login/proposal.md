## Why

Sau khi có schema Supabase (`add-supabase-schema`), bước kế là đưa toàn bộ app ra sau cổng xác thực: chưa đăng nhập thì không vào được trang nghiệp vụ nào. Đây cũng là tiền đề bắt buộc cho change RLS (`add-rls-policies`) — phải có session thật của giáo viên mới test được phân tách dữ liệu.

## What Changes

- Thêm dependency `@supabase/supabase-js`; tạo client dùng chung `src/lib/supabase.js` đọc `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- Thêm `src/hooks/useAuth.js` + context: expose `user`, `teacher` (profile + `is_admin`), `loading`, `login`, `logout`.
- Thêm `LoginPage` (email/password) và trang đặt mật khẩu lần đầu từ liên kết invite.
- Thêm **auth gate** bọc toàn bộ App: chưa có session hợp lệ → hiển thị `LoginPage`; có session → render app như hiện tại. (App điều hướng bằng state `page`, KHÔNG dùng react-router, nên gate là một wrapper component, không phải route guard.)
- Thêm nút đăng xuất trong Navbar/topbar.
- Khôi phục session từ token đã lưu khi tải lại trang (Supabase tự lưu, `useAuth` đọc lại).

Phạm vi change này **chỉ là auth client + login/logout + gate**. KHÔNG bao gồm: bật RLS (→ `add-rls-policies`), service layer thay `db.js` (→ các change service), Admin Panel (→ `add-admin-panel`). App vẫn đọc/ghi `db.js`/localStorage như cũ sau khi đăng nhập.

## Capabilities

### New Capabilities
- `authentication`: Đăng nhập/đăng xuất email-password qua Supabase Auth, quản lý + khôi phục session, gate chặn mọi trang khi chưa đăng nhập, luồng đặt mật khẩu lần đầu từ liên kết invite.

### Modified Capabilities
<!-- Không có. Tầng dữ liệu localStorage và data spec không đổi ở change này. -->

## Impact

- **Dependencies**: thêm `@supabase/supabase-js`. Cần `.env` đã có `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (từ change schema).
- **Code mới**: `src/lib/supabase.js`, `src/hooks/useAuth.js` (+ context provider), `src/pages/LoginPage.jsx`, trang đặt mật khẩu (vd `src/pages/SetPasswordPage.jsx`), một auth gate wrapper (bọc trong `src/main.jsx` hoặc `App.jsx`).
- **Code sửa**: `src/main.jsx` (bọc `AuthProvider` + gate), `src/App.jsx` / `Navbar` (thêm nút đăng xuất, hiển thị tên user). Không gỡ `db.js`.
- **Phụ thuộc lộ trình**: cần `add-supabase-schema` xong (bảng `teachers`, trigger tạo profile, admin đã seed) để đăng nhập có profile.
