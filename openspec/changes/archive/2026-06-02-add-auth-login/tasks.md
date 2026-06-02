## 1. Supabase client

- [x] 1.1 `npm install @supabase/supabase-js`
- [x] 1.2 Tạo `src/lib/supabase.js`: `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)` với `persistSession: true`, `autoRefreshToken: true`
- [x] 1.3 Xác nhận `.env` đã có `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (từ change schema); báo lỗi rõ ràng nếu thiếu

## 2. Auth hook & context

- [x] 2.1 Tạo `src/hooks/useAuth.js` với `AuthProvider`: state `user`, `teacher`, `loading`
- [x] 2.2 Đăng ký `supabase.auth.onAuthStateChange`; set `user` + `loading=false` khi có sự kiện đầu tiên
- [x] 2.3 Khi có `user`, SELECT row `teachers` theo `auth.uid()` và lưu vào `teacher` (gồm `is_admin`)
- [x] 2.4 Expose `login(email, password)`, `logout()` qua context; export hook `useAuth()`

## 3. Login & set-password UI

- [x] 3.1 Tạo `src/pages/LoginPage.jsx`: form email/password, gọi `login`, hiển thị lỗi khi sai
- [x] 3.2 Tạo `src/pages/SetPasswordPage.jsx`: nhận luồng invite/recovery, gọi `supabase.auth.updateUser({ password })`
- [x] 3.3 Xử lý liên kết invite hết hạn/không hợp lệ: hiển thị lỗi + hướng dẫn liên hệ admin

## 4. Auth gate & tích hợp

- [x] 4.1 Bọc `<AuthProvider>` quanh app trong `src/main.jsx`
- [x] 4.2 Tạo `AuthGate`: `loading` → màn chờ; phát hiện luồng invite/recovery → `SetPasswordPage`; không có `user` → `LoginPage`; có `user` → `<App/>`
- [x] 4.3 Thêm nút đăng xuất + hiển thị tên/email user trong Navbar/topbar

## 5. Cấu hình Supabase Auth

- [x] 5.1 Thêm redirect URL của app (dev + prod) vào Auth → URL Configuration trên Supabase
- [x] 5.2 Bật Email auth provider; kiểm tra template email invite

## 6. Kiểm tra & bàn giao change

- [x] 6.1 Chạy `openspec validate add-auth-login` và tự rà từng requirement trong spec đã được task nào phủ
- [x] 6.2 Tổng kết cho người dùng: liệt kê những gì change này đã làm được (client Supabase, useAuth, LoginPage, SetPasswordPage, auth gate, logout) và những gì CHƯA thuộc phạm vi (RLS, service layer, admin panel)
- [x] 6.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Mở app khi chưa đăng nhập → phải thấy `LoginPage`, không vào được trang nghiệp vụ
  - Đăng nhập bằng tài khoản admin đã seed → vào được app
  - Tải lại trang → vẫn đăng nhập (không bắt login lại)
  - Bấm đăng xuất → quay về `LoginPage`
  - Đăng nhập sai mật khẩu → hiện lỗi, không tạo session
  - Invite 1 user mới qua Supabase Dashboard → mở link email → đặt mật khẩu → đăng nhập được
- [x] 6.4 Ghi lại kết quả test + bất kỳ vấn đề tồn đọng (vd cấu hình email/redirect) vào cuối; xác nhận với người dùng trước khi sang change #3
