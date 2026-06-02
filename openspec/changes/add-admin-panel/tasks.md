## 1. Route & guard admin

- [ ] 1.1 Thêm route admin (vd `/admin`) trong routing
- [ ] 1.2 Guard admin: bọc route bằng `ProtectedRoute` + kiểm `teacher.is_admin`; không phải admin → redirect
- [ ] 1.3 Thêm lối vào Admin Panel trong `Navbar` chỉ hiện khi `is_admin`

## 2. Danh sách giáo viên & tạo/giao lớp

- [ ] 2.1 Truy vấn đọc danh sách `teachers` (admin SELECT-all) — hiển thị danh sách giáo viên
- [ ] 2.2 Mở đường cho `classService.create`/`update` nhận `teacher_id` tường minh ở luồng admin (giữ luồng teacher không đổi)
- [ ] 2.3 Form tạo lớp + chọn giáo viên phụ trách → `classService.create({ ..., teacher_id })`
- [ ] 2.4 Đổi giáo viên phụ trách một lớp → `classService.update(id, { teacher_id })`

## 3. Xem read-only dữ liệu toàn trung tâm

- [ ] 3.1 Chọn một giáo viên → nạp lớp/học sinh của giáo viên đó qua service đọc hiện có (lọc theo giáo viên ở client)
- [ ] 3.2 Tái dùng component xem với cờ `readOnly` để ẩn mọi nút sửa/xóa dữ liệu nghiệp vụ
- [ ] 3.3 Nhãn rõ "chế độ chỉ đọc" trên các màn admin xem dữ liệu

## 4. Quy trình mời giáo viên (ngoài app)

- [ ] 4.1 Viết hướng dẫn mời giáo viên qua Supabase Dashboard (Auth → Invite user); trigger tự tạo row `teachers`
- [ ] 4.2 Xác nhận giáo viên mới mời xuất hiện trong danh sách giáo viên của Admin Panel sau khi xác nhận

## 5. Kiểm tra & bàn giao change

- [ ] 5.1 Chạy `openspec validate add-admin-panel` và rà từng requirement đã được task/test nào phủ
- [ ] 5.2 Tổng kết cho người dùng: những gì change này đã làm (route admin, tạo/giao lớp, xem read-only, quy trình mời qua Dashboard) và lộ trình Supabase Multi-Teacher hoàn tất
- [ ] 5.3 Viết hướng dẫn test thủ công cho người dùng và cùng chạy qua:
  - Đăng nhập teacher thường → cố mở `/admin` → bị chặn/redirect; không thấy lối vào admin trong Navbar
  - Đăng nhập admin → mở Admin Panel → thấy danh sách giáo viên
  - Admin tạo lớp + giao cho teacher A → đăng nhập teacher A → lớp xuất hiện trong danh sách của A
  - Admin đổi lớp sang teacher B → lớp chuyển sang danh sách B
  - Admin chọn xem dữ liệu teacher A → thấy lớp/học sinh của A, không có nút sửa/xóa; thử gọi ghi trực tiếp → DB từ chối
  - Mời một giáo viên qua Supabase Dashboard → giáo viên xác nhận → xuất hiện trong danh sách Admin Panel
- [ ] 5.4 Ghi lại kết quả test + vấn đề tồn đọng; tổng kết toàn lộ trình và xác nhận có thể xóa change gốc `add-supabase-multi-teacher` (tham chiếu) theo ghi chú ROADMAP
