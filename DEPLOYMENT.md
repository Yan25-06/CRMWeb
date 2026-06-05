# Runbook Triển Khai Production

Hướng dẫn các bước **bắt buộc** trước khi giao app cho người dùng thật (Ms.Phương + giáo viên).

> 🟦 = code/app đã lo. 🖐️ = **thao tác thủ công** trên Supabase Dashboard, không thể tự động hóa.
> Làm tuần tự theo thứ tự dưới đây.

---

## 1. 🖐️ Dữ liệu sạch + bootstrap admin

**KHÔNG chạy `supabase/seed/seed_mock_data.sql` lên database production** — file đó chỉ để test, sẽ tạo dữ liệu giả.

Tạo tài khoản admin đầu tiên (Ms.Phương):

1. Supabase Dashboard → **Authentication → Users → Invite user** → nhập email admin → gửi.
2. DB trigger tự tạo row tương ứng trong bảng `teachers`.
3. Mở **SQL Editor**, chạy (thay email thật):
   ```sql
   update public.teachers
   set is_admin = true
   where id = (select id from auth.users where email = 'admin@example.com');
   ```

> **Tại sao phải dùng SQL Editor?** Trigger `prevent_is_admin_change` chặn mọi thay đổi `is_admin` đến qua API (PostgREST) để không ai tự nâng quyền admin. Truy cập SQL trực tiếp không có JWT claims nên được phép — đây là cửa bootstrap duy nhất.

Mời các giáo viên còn lại: lặp bước 1 (KHÔNG set `is_admin`). Giáo viên thường có quyền hạn chế theo RLS.

---

## 2. 🖐️ Cấu hình Supabase Auth cho domain production

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://<username>.github.io/RollCallWeb/`
- **Redirect URLs**: thêm `https://<username>.github.io/RollCallWeb/`

> **Tại sao?** Liên kết invite và "quên mật khẩu" sẽ redirect về URL này. Nếu sai, người dùng mở link sẽ về trang trắng/sai domain và không đặt được mật khẩu.

**Tắt tự đăng ký**: Authentication → **Sign In / Providers → Email** → tắt **"Allow new users to sign up"**.

> **Tại sao?** App chỉ cho admin mời người dùng. Trang đăng nhập không có nút đăng ký, nhưng API vẫn mở nếu không tắt — người lạ có thể tự tạo tài khoản (dù RLS chặn xem dữ liệu, vẫn không nên cho).

---

## 3. 🖐️ Bật sao lưu dữ liệu

Đây là dữ liệu **học phí + tài chính** thật. Trước khi nhập liệu thật:

- Supabase Dashboard → **Database → Backups** → bật daily backup (hoặc Point-in-Time Recovery nếu gói cho phép).

> **Tại sao?** Mất dữ liệu học phí = mất tiền/uy tín. Backup là lưới an toàn duy nhất khi xóa nhầm hoặc lỗi.

---

## 4. 🖐️ Kiểm thử phân quyền (giáo viên thường)

Đăng nhập bằng **một tài khoản giáo viên KHÔNG phải admin** và xác nhận UI khớp RLS:

- ✅ Ẩn mọi nút **thêm/sửa/xóa học sinh** (quick-add, "Thêm học sinh", Import Excel, bulk delete, nút Sửa ở sidebar).
- ✅ Ẩn nút **tạo/sửa/xóa đề Mock Test**.
- ✅ Ẩn mục **"Học Phí"** và **"Admin"** trên menu.
- ✅ **Vẫn làm được**: nhập điểm mock test, điểm danh, bài tập, đổi trạng thái/sửa enrollment.

> **Tại sao?** Migration `20260605000001` khiến giáo viên read-only trên `students` + `mock_tests` ở tầng DB. Nếu UI hiện nút mà DB chặn → giáo viên bấm sẽ gặp lỗi khó hiểu. Bước này xác nhận hai tầng khớp nhau.

---

## 5. 🟦 Build & Deploy

```bash
npm install
npm run build      # xuất ra docs/ (KHÔNG phải dist/), base /RollCallWeb/
```

Commit thư mục `docs/` và push. GitHub Pages phục vụ từ `docs/` trên nhánh chính.

> Lưu ý: runbook này (`DEPLOYMENT.md`) đặt ở root, KHÔNG trong `docs/`, vì `docs/` bị `vite build` ghi đè mỗi lần build.

---

## Checklist nhanh trước go-live

- [ ] Không có dữ liệu mock trên DB production
- [ ] Tài khoản admin đã set `is_admin = true` qua SQL Editor
- [ ] Site URL + Redirect URLs trỏ đúng domain
- [ ] Tự đăng ký đã tắt
- [ ] Backup đã bật
- [ ] Đã kiểm thử bằng tài khoản giáo viên thường
- [ ] `npm run build` thành công, `docs/` đã deploy
