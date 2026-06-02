## Context

App là React 18 + Vite. Điều hướng nội bộ bằng state `page` trong `App.jsx` + `switch` (KHÔNG có react-router-dom). `main.jsx` render `<App/>`. Dữ liệu hiện vẫn ở `db.js`/localStorage — change này chưa đụng tới.

Change trước (`add-supabase-schema`) đã dựng: bảng `teachers` (1-1 `auth.users`, có `is_admin`), trigger tự tạo profile khi có user mới, và 1 admin seed sẵn. Change này thêm tầng auth phía client để mọi người phải đăng nhập trước khi dùng app, và để có session thật cho change RLS kế tiếp.

## Goals / Non-Goals

**Goals:**
- Mọi trang nghiệp vụ nằm sau cổng đăng nhập; chưa login → chỉ thấy `LoginPage`.
- `useAuth` cung cấp `user`, `teacher` (profile + `is_admin`), `loading`, `login`, `logout` cho toàn app.
- Khôi phục session khi reload (không bắt đăng nhập lại).
- Giáo viên được invite đặt được mật khẩu lần đầu qua liên kết email.
- Đăng xuất xóa session, quay về `LoginPage`.

**Non-Goals:**
- Bật/viết RLS policy (→ `add-rls-policies`).
- Thay `db.js` bằng service layer (→ các change service).
- Admin Panel / mời giáo viên trong app (→ `add-admin-panel`; invite làm qua Dashboard).
- Phân quyền hiển thị UI theo `is_admin` ở mức chi tiết (chỉ expose `is_admin` qua hook; dùng thật ở `add-admin-panel`).

## Decisions

**1. Auth gate là wrapper component, không phải route guard.**
App không dùng react-router nên không có "route" để guard. Giải pháp: một component `AuthGate` (hoặc logic trong `main.jsx`) đọc `useAuth()`:
- `loading` → màn hình chờ.
- Không có `user` → render `LoginPage` (hoặc `SetPasswordPage` nếu đang ở luồng invite/recovery).
- Có `user` → render `<App/>` như hiện tại.
Cân nhắc khác: thêm react-router để dùng `ProtectedRoute` — loại vì kéo theo refactor toàn bộ điều hướng state hiện có, ngoài phạm vi.

**2. `AuthProvider` + `useAuth` hook đặt ở `src/hooks/useAuth.js`.**
Provider bọc ở `main.jsx` (ngoài cùng) để cả `AuthGate` lẫn `App` đều dùng được. Hook đăng ký `supabase.auth.onAuthStateChange` để cập nhật `user`/session realtime, và load `teacher` profile (SELECT từ bảng `teachers` theo `auth.uid()`) sau khi có user. Khi chưa có RLS, SELECT vẫn chạy được; sau khi RLS bật, cần policy cho phép user đọc chính profile của mình — ghi chú lại để change RLS xử lý.

**3. Đặt mật khẩu lần đầu qua liên kết invite/recovery.**
Supabase gửi email invite chứa link với token; khi mở link, client nhận event `PASSWORD_RECOVERY` (hoặc session tạm) → hiển thị `SetPasswordPage` để gọi `supabase.auth.updateUser({ password })`. Phát hiện luồng này qua URL hash / `onAuthStateChange`. Liên kết hết hạn/không hợp lệ → hiện lỗi + hướng dẫn liên hệ admin.

**4. Client Supabase singleton ở `src/lib/supabase.js`.**
`createClient(url, anonKey)` với `persistSession: true`, `autoRefreshToken: true` (mặc định). Token lưu ở localStorage do Supabase quản lý → reload tự khôi phục.

**5. Nút đăng xuất gọi `supabase.auth.signOut()`.**
Đặt trong Navbar/topbar, hiển thị tên/email user. Sau signOut, `onAuthStateChange` set `user = null` → gate tự chuyển về `LoginPage`.

## Risks / Trade-offs

- **Đọc `teachers` profile khi RLS chưa bật** → giờ chạy thoải mái; sau khi RLS bật ở change kế, nếu thiếu policy "user đọc profile mình" sẽ vỡ login. Mitigation: ghi rõ yêu cầu policy này trong design của `add-rls-policies`.
- **Email invite cần cấu hình SMTP/redirect URL trên Supabase** → mặc định Supabase có email built-in giới hạn rate; redirect URL phải thêm vào allowlist. Mitigation: ghi trong task cấu hình Auth settings + test luồng invite thật.
- **Gate bọc ngoài có thể nháy `LoginPage` trước khi session khôi phục** → dùng trạng thái `loading` để hiện màn hình chờ tới khi `onAuthStateChange` phát lần đầu.
- **App đang seed demo data localStorage trong `useEffect`** → không xung đột vì change này không gỡ `db.js`; chấp nhận tới khi service layer cutover.

## Migration Plan

1. `npm install @supabase/supabase-js`.
2. Tạo `src/lib/supabase.js` (client từ env).
3. Tạo `AuthProvider` + `useAuth` (`src/hooks/useAuth.js`); load user + teacher profile, expose API.
4. Tạo `LoginPage` và `SetPasswordPage`.
5. Bọc `AuthProvider` + `AuthGate` ở `main.jsx`; gate chọn Login / SetPassword / App.
6. Thêm nút đăng xuất + hiển thị user trong Navbar.
7. Cấu hình Auth trên Supabase (redirect URL); test login, reload, logout, invite → đặt mật khẩu.

Rollback: gỡ `AuthProvider`/gate khỏi `main.jsx`, app trở lại không cần đăng nhập (vì dữ liệu vẫn localStorage). Vì là nhánh git riêng nên rollback = checkout nhánh cũ.

## Open Questions

- `SetPasswordPage` phát hiện luồng invite qua URL hash hay qua event `onAuthStateChange`? (Ưu tiên onAuthStateChange + kiểm tra `type=invite/recovery` trong hash.)
- Có cần trang "Quên mật khẩu" ngay change này không, hay để giáo viên báo admin invite lại? (Đề xuất: thêm link "Quên mật khẩu" gọi `resetPasswordForEmail` — nhẹ, gom luôn vào đây hoặc để sau.)
