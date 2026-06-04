## 1. SetPasswordPage — nhập tên (D1)

- [ ] 1.1 Thêm ô "Tên hiển thị" (required, trim không rỗng) vào `SetPasswordPage`
- [ ] 1.2 Submit gọi `completePasswordSetup(name)` cùng mật khẩu
- [ ] 1.3 Validate: chặn hoàn tất khi tên rỗng, hiển thị lỗi

## 2. useAuth — lưu teachers.name (D1)

- [ ] 2.1 Mở rộng `completePasswordSetup(name)` trong `useAuth.jsx`
- [ ] 2.2 Sau khi đặt mật khẩu, cập nhật `teachers.name` qua `teacherService.update` cho `user.id`
- [ ] 2.3 Refresh `teacher` profile trong state; KHÔNG await supabase trong `onAuthStateChange`

## 3. Hiển thị ưu tiên tên (D2)

- [ ] 3.1 Xác nhận `Navbar` đã dùng `teacher?.name || user.email` (đã đúng)
- [ ] 3.2 Rà soát các điểm hiển thị danh tính giáo viên hiện hành (Settings, v.v.) và chuẩn hóa theo pattern
- [ ] 3.3 (Tùy chọn) thêm helper `displayName(teacher, user)` nếu lặp nhiều

## 4. Kiểm thử

- [ ] 4.1 Test onboarding: nhập tên + mật khẩu → `teachers.name` được lưu, app hiển thị tên
- [ ] 4.2 Test validate thiếu tên
- [ ] 4.3 Test fallback email cho giáo viên cũ chưa có tên
- [ ] 4.4 Cập nhật `CLAUDE.md` nếu mô tả luồng auth/onboarding thay đổi
