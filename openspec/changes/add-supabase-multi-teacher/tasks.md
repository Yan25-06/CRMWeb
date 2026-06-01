## 1. Supabase project & schema

- [ ] 1.1 Tạo Supabase project (free tier), lưu URL + anon key vào `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] 1.2 Viết migration tạo bảng `teachers` (id = auth.users.id, email, name, is_admin)
- [ ] 1.3 Viết migration tạo các bảng nghiệp vụ: students, classes, enrollments, sessions, attendance, homeworks, fees, payments, reviews, session_reviews, mock_tests, mock_test_results, hw_assignments, submissions, general_comments, settings, schedule — PK UUID, FK `teacher_id`/`class_id`/`student_id`
- [ ] 1.4 Seed 1 tài khoản admin thủ công qua Dashboard, set `is_admin = true`

## 2. Row Level Security

- [ ] 2.1 Bật RLS trên tất cả bảng nghiệp vụ
- [ ] 2.2 Policy SELECT: teacher thấy lớp/học sinh của mình (`teacher_id = auth.uid()`), admin thấy tất cả
- [ ] 2.3 Policy SELECT bảng con: suy quyền qua `class_id`/`student_id` về teacher sở hữu
- [ ] 2.4 Policy INSERT/UPDATE/DELETE: chỉ teacher trên dữ liệu của mình; KHÔNG cấp policy ghi cho admin (read-only)
- [ ] 2.5 Policy cho `classes`: chỉ admin được INSERT/giao `teacher_id`; teacher chỉ UPDATE nội dung lớp được giao
- [ ] 2.6 Test RLS: teacher A không đọc/ghi được dữ liệu của teacher B; admin không ghi được dữ liệu nghiệp vụ

## 3. Edge Function: invite-teacher

- [ ] 3.1 Tạo Edge Function `invite-teacher` nhận {email, name}
- [ ] 3.2 Verify caller là admin (kiểm tra `is_admin` từ JWT/teachers)
- [ ] 3.3 Gọi `auth.admin.inviteUserByEmail()` bằng `service_role` key (server-side), tạo row `teachers`
- [ ] 3.4 Deploy function, test gọi từ admin và từ non-admin (phải bị từ chối)

## 4. Client integration & auth

- [ ] 4.1 Thêm dependency `@supabase/supabase-js`, tạo `src/lib/supabase.js`
- [ ] 4.2 Tạo `src/hooks/useAuth.js` + context: expose `user`, `teacher` (profile + is_admin), `loading`, `login`, `logout`
- [ ] 4.3 Tạo `LoginPage` (email/password) và trang đặt mật khẩu lần đầu từ liên kết invite
- [ ] 4.4 Tạo `ProtectedRoute`; bọc toàn bộ route nghiệp vụ; route admin chặn thêm theo `is_admin`
- [ ] 4.5 Thêm nút đăng xuất

## 5. Service layer

- [ ] 5.1 Tạo `src/services/` với service cho từng entity (getAll/get/create/update/remove trả Promise)
- [ ] 5.2 Thay dần các import `db.js` trong component bằng service tương ứng (students, classes, sessions...)
- [ ] 5.3 Thêm optimistic update + rollback cho thao tác hay dùng (điểm danh, nhập điểm)
- [ ] 5.4 Thêm banner mất kết nối + retry tự động khi có mạng lại
- [ ] 5.5 Xóa `src/store/db.js` và toàn bộ logic localStorage sau khi mọi component đã chuyển

## 6. Admin Panel

- [ ] 6.1 Trang Admin Panel (chỉ `is_admin`): danh sách giáo viên
- [ ] 6.2 Form mời giáo viên mới (email + tên) gọi Edge Function `invite-teacher`
- [ ] 6.3 Tạo lớp và giao cho giáo viên (set `teacher_id`)
- [ ] 6.4 Màn hình xem read-only dữ liệu theo từng giáo viên (ẩn nút sửa/xóa)

## 7. Verify & cutover

- [ ] 7.1 Test end-to-end: admin mời → giáo viên đặt mật khẩu → đăng nhập → nhập dữ liệu
- [ ] 7.2 Test phân tách: 2 giáo viên không thấy dữ liệu nhau; admin xem được cả hai read-only
- [ ] 7.3 Mời 5 giáo viên thật
- [ ] 7.4 (Tùy chọn) Cron ping giữ project khỏi pause sau 7 ngày
