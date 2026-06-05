## 1. Service & Hook layer

- [ ] 1.1 Xóa `teacherName` / `teacher_name` khỏi `DEFAULT_SETTINGS`, `fromDB`, `toDB` trong `src/services/settingsService.js`
- [ ] 1.2 Thêm method `updateTeacherName(name)` vào `useAuth` (`src/hooks/useAuth.jsx`): `supabase.from('teachers').update({ name }).eq('id', user.id)` rồi refresh state `teacher`
- [ ] 1.3 Export `updateTeacherName` qua context value của `AuthProvider`

## 2. SettingsPage — Section Tài khoản cá nhân

- [ ] 2.1 Viết lại `src/pages/SettingsPage.jsx`: đọc `teacher` và `user` từ `useAuth()` thay vì lấy tên từ `settingsService`
- [ ] 2.2 Render section "Tài khoản cá nhân" với tên (fallback email khi rỗng) và email read-only
- [ ] 2.3 Thêm edit state riêng cho section tài khoản: nút "Chỉnh sửa" → input + Lưu/Hủy
- [ ] 2.4 Lưu tên qua `updateTeacherName`, validate tên không rỗng, toast success/error, trở về read-only

## 3. SettingsPage — Section Đổi mật khẩu

- [ ] 3.1 Render section "Đổi Mật Khẩu" với pattern edit button (3 ô: hiện tại, mới, xác nhận)
- [ ] 3.2 Validate: mật khẩu mới tối thiểu 6 ký tự, xác nhận khớp — báo lỗi trước khi gọi Supabase
- [ ] 3.3 Xác minh mật khẩu cũ qua `supabase.auth.signInWithPassword({ email, password: old })`, báo "Mật khẩu hiện tại không đúng" nếu lỗi
- [ ] 3.4 Đổi mật khẩu qua `supabase.auth.updateUser({ password: new })`, toast success, reset form về read-only

## 4. SettingsPage — Section Thông tin trung tâm (admin)

- [ ] 4.1 Render section "Thông Tin Trung Tâm" chỉ khi `teacher.is_admin`
- [ ] 4.2 Đọc `centerName` từ `settingsService.get()`, hiển thị read-only + nút "Chỉnh sửa"
- [ ] 4.3 Edit state riêng: lưu qua `settingsService.upsert({ centerName })`, toast success, Hủy khôi phục giá trị cũ

## 5. Kiểm tra & đồng bộ

- [ ] 5.1 Build (`npm run build`) không lỗi; kiểm tra Navbar hiển thị tên mới sau khi đổi
- [ ] 5.2 Kiểm tra giáo viên thường KHÔNG thấy section trung tâm; admin thấy đủ 3 section
- [ ] 5.3 Cập nhật `CLAUDE.md` phần mô tả SettingsPage và model settings (bỏ `teacher_name`)
