## Context

App là React 18 + Vite, toàn bộ dữ liệu trong `src/store/db.js` (~1100 dòng) đọc/ghi localStorage. Một giáo viên, một trình duyệt, không có tài khoản. Trung tâm cần 5 giáo viên dùng tài khoản riêng + 1 admin giám sát. Dữ liệu hiện chỉ là mock nên không cần migrate.

Quyết định nghiệp vụ đã chốt qua thảo luận:
- Mỗi giáo viên dạy độc lập; học sinh thuộc về đúng 1 giáo viên (không học chéo).
- Admin tạo lớp rồi giao cho giáo viên; giáo viên không tự tạo lớp.
- Admin: read-all, không sửa, không dạy.

## Goals / Non-Goals

**Goals:**
- Nhiều giáo viên đăng nhập tài khoản riêng, dữ liệu tách biệt ở tầng DB (RLS).
- Admin tạo tài khoản giáo viên, tạo & giao lớp, xem read-only toàn bộ.
- Service layer cô lập Supabase khỏi UI để dễ thay backend sau này.
- Trải nghiệm mượt khi mạng chập chờn (optimistic + retry).

**Non-Goals:**
- Offline-first thật (sync queue, conflict resolution) — overkill cho 5 user.
- Migrate dữ liệu localStorage cũ — bắt đầu sạch.
- Học sinh học nhiều giáo viên / chia sẻ lớp giữa giáo viên.
- Mobile native app.

## Decisions

**1. Supabase thay vì Firebase / custom backend.**
Data model hiện tại đã quan hệ rõ (students → classes → sessions...), hợp PostgreSQL hơn Firestore document. Supabase cho sẵn Auth + RLS + REST, free tier đủ cho 5 user. Custom Node+PG tốn công dựng Auth và hosting.

**2. Phân tách dữ liệu bằng RLS, không bằng filter ở frontend.**
Mọi bảng gắn cột phân quyền; policy enforce ở PostgreSQL nên frontend không thể lách. Quyền truy cập đi qua **lớp được giao** + ownership học sinh:
- `classes.teacher_id` = giáo viên được giao.
- `students.teacher_id` = giáo viên sở hữu.
- Bảng con (sessions, attendance, homeworks, fees, reviews...) suy ra quyền qua `class_id`/`student_id`.
- Admin (`teachers.is_admin = true`): policy SELECT cho phép xem tất cả; KHÔNG có policy INSERT/UPDATE/DELETE cho admin → read-only enforce ở DB.

Cân nhắc khác: filter ở service layer — loại vì không an toàn, anon key lộ ra client.

**3. `teachers` table riêng, link 1-1 với `auth.users` qua `id`.**
`teachers.id` = `auth.users.id`. Profile (name, is_admin) tách khỏi auth. `auth.uid()` dùng trực tiếp trong policy.

**4. Service layer `src/services/` — UI không gọi `supabase.*` trực tiếp.**
Mỗi entity một file (`studentService.js`, `classService.js`...) export hàm `getAll/get/create/update/remove` trả Promise. Đổi backend sau này chỉ sửa thư mục này. Đây là quyết định kiến trúc quan trọng nhất cho khả năng thay thế.

**5. Admin invite qua Edge Function.**
`supabase.auth.admin.inviteUserByEmail()` cần `service_role` key — tuyệt đối không để ở frontend. Một Edge Function `invite-teacher` nhận {email, name}, verify caller là admin, gọi admin API, tạo row `teachers`. Frontend chỉ gọi function qua anon session.

**6. Online-only + optimistic UI + retry.**
Không sync engine. Service trả Promise; UI cập nhật optimistic cho thao tác hay dùng (điểm danh, nhập điểm) rồi rollback nếu lỗi. Banner "mất kết nối" + retry. 80% cảm giác offline với 20% độ phức tạp.

**7. Auth state qua `useAuth` hook + context.**
`useAuth` bọc `supabase.auth`, expose `user`, `teacher` (profile + is_admin), `loading`. `ProtectedRoute` chặn route khi chưa login; route admin chặn thêm theo `is_admin`.

## Risks / Trade-offs

- **Supabase free tier pause project sau 7 ngày không activity** → lần vào đầu chờ ~30s. Mitigation: cron ping mỗi ngày, hoặc upgrade Pro nếu phiền.
- **Admin read-only chỉ dựa vào thiếu policy ghi** → nếu sau này lỡ thêm policy ghi cho admin sẽ phá invariant. Mitigation: ghi rõ trong spec + comment trong migration, test RLS.
- **Mất offline hoàn toàn so với localStorage hiện tại** → giáo viên ở chỗ mạng yếu bị ảnh hưởng. Mitigation: optimistic UI + retry; đã chấp nhận trade-off này.
- **Service layer thêm boilerplate** → nhiều file hơn. Chấp nhận để đổi lấy khả năng thay backend.
- **Big-bang cutover (xóa localStorage)** → không rollback từng phần. Chấp nhận vì chỉ mock data, không mất gì thật.

## Migration Plan

1. Dựng Supabase project, chạy migration tạo bảng + RLS + Edge Function.
2. Seed 1 admin thủ công qua Supabase Dashboard.
3. Tích hợp `@supabase/supabase-js`, `useAuth`, `ProtectedRoute`, Login page.
4. Viết `src/services/` cho từng entity, thay dần các import `db.js`.
5. Build Admin Panel (tạo giáo viên, tạo & giao lớp, xem read-only).
6. Xóa `db.js` + logic localStorage.
7. Admin invite 5 giáo viên → họ đặt mật khẩu → bắt đầu nhập data.

Rollback: giữ nhánh git trước cutover; vì dữ liệu là mock nên rollback = checkout nhánh cũ.

## Decisions (đã chốt thêm)

**8. Reset mật khẩu qua luồng "Quên mật khẩu" của Supabase.**
Giáo viên tự reset qua `supabase.auth.resetPasswordForEmail()` — Supabase gửi email reset, không cần admin can thiệp. Không build cơ chế reset riêng.

## Open Questions

- Cron giữ project khỏi pause: KHÔNG làm ngay (task 7.4 để tùy chọn). 5 giáo viên dùng gần như hằng ngày nên hiếm khi chạm mốc 7 ngày im lặng; chỉ cân nhắc nếu có kỳ nghỉ dài cả trung tâm ngừng dùng.
