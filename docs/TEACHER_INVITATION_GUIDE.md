# Hướng Dẫn Mời Giáo Viên - Bảng Điều Khiển Admin

## Quy Trình Mời Giáo Viên Qua Supabase Dashboard

Hệ thống rollcall-manager không có luồng tạo tài khoản giáo viên trong app. Thay vào đó, admin sẽ mời giáo viên qua **Supabase Dashboard**.

### Bước 1: Vào Supabase Dashboard
1. Truy cập [Supabase Dashboard](https://app.supabase.com)
2. Chọn project `rollcall-manager`
3. Vào **Authentication** → **Users**

### Bước 2: Mời Giáo Viên Mới
1. Click **Invite User** (hoặc **Invite** button)
2. Nhập **Email** của giáo viên cần mời
3. Supabase sẽ gửi email mời đến địa chỉ đó
4. Click **Send Invite**

### Bước 3: Giáo Viên Nhận Và Xác Nhận
1. Giáo viên sẽ nhận email từ Supabase với link xác nhận
2. Link sẽ dẫn đến app (hoặc Supabase) để người dùng đặt mật khẩu
3. Sau khi đặt mật khẩu, giáo viên xác nhận thông tin
4. **Database trigger tự động tạo row `teachers` trong bảng `teachers`** với các thông tin cơ bản từ auth user

### Bước 4: Kiểm Tra Trong Admin Panel
1. Đăng nhập vào Admin Panel (chỉ admin mới có quyền)
2. Vào **Admin** → **Danh Sách Giáo Viên**
3. Tìm tên giáo viên vừa mời — sẽ xuất hiện trong danh sách
4. Admin có thể gán lớp cho giáo viên này

## Lưu Ý Kỹ Thuật

### Trigger Database
- Khi một user được tạo trong **Authentication** và xác nhận email, database trigger tự động:
  - Tạo row mới trong bảng `teachers`
  - Đặt `is_admin = false` (giáo viên thường)
  - Đặt `name`, `email` từ auth user
  - Tạo row `settings` mặc định cho giáo viên

### Nếu Giáo Viên Không Xuất Hiện
1. Kiểm tra email xác nhận — có thể user chưa confirm email
2. Trong Supabase Dashboard, xem user status: "Confirmed" hay "Not Confirmed"?
3. Nếu chưa confirmed, request user xác nhận email lại
4. Có thể trigger lỗi — kiểm tra **Database** → **Triggers** trong Supabase Dashboard

### Tạo Admin
- Để đặt giáo viên là admin: truy cập **Supabase Dashboard** → **SQL Editor**
- Chạy query:
  ```sql
  UPDATE teachers 
  SET is_admin = true 
  WHERE email = 'admin@example.com';
  ```

## Quy Trình Xóa/Vô Hiệu Hóa Giáo Viên
- **Từ Supabase Auth**: Disable hoặc delete user trong **Authentication** → **Users**
- **Từ App**: Admin không thể xóa giáo viên trong app (read-only chế độ admin)
- Để vô hiệu hóa: set `is_active = false` (nếu có) hoặc xóa user khỏi Auth

---

**Lần cập nhật cuối:** 2026-06-03
