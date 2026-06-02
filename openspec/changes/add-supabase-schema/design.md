## Context

App là React 18 + Vite, toàn bộ dữ liệu nằm trong `src/store/db.js` (~1100 dòng) đọc/ghi localStorage. Trung tâm cần 5 giáo viên + 1 admin với dữ liệu tách biệt. Đây là change **nền tảng** của lộ trình: dựng Supabase project + schema PostgreSQL cho toàn bộ entity. Các change kế (auth, RLS, service layer, admin panel) đều build trên schema này.

Quyết định nghiệp vụ đã chốt (từ design tổng của lộ trình):
- Mỗi giáo viên dạy độc lập; học sinh thuộc đúng 1 giáo viên.
- Admin tạo lớp rồi giao cho giáo viên; admin read-all, không sửa, không dạy.
- Dữ liệu hiện chỉ là mock → không migrate, bắt đầu sạch.

## Goals / Non-Goals

**Goals:**
- Một Supabase project hoạt động với credentials trong `.env`.
- Migration tạo bảng `teachers` (link 1-1 `auth.users`) + toàn bộ bảng nghiệp vụ, UUID PK.
- Cột phân quyền (`teacher_id`/`class_id`/`student_id`) sẵn sàng cho RLS ở change sau.
- Database trigger tự tạo row `teachers` khi user mới được tạo trong auth.
- 1 admin được seed thủ công.

**Non-Goals:**
- Bật RLS / viết policy (→ change `add-rls-policies`).
- Thêm client `@supabase/supabase-js`, auth UI, `ProtectedRoute` (→ `add-auth-login`).
- Service layer, optimistic UI, xóa `db.js` (→ các change service layer + cutover).
- Migrate dữ liệu localStorage cũ.

## Decisions

**1. Supabase (PostgreSQL) làm backend.**
Data model đã quan hệ rõ (students → classes → sessions...), hợp PostgreSQL. Supabase cho sẵn Auth + RLS + REST, free tier đủ 5 user. Cân nhắc khác: Firebase/Firestore (document, không hợp quan hệ), custom Node+PG (tốn công dựng Auth/hosting) — loại.

**2. `teachers` link 1-1 với `auth.users` qua `id`.**
`teachers.id = auth.users.id` (FK tới `auth.users`, ON DELETE CASCADE). Profile (name, is_admin) tách khỏi auth, để `auth.uid()` dùng trực tiếp trong RLS policy sau này.

**3. UUID PK + cột phân quyền ngay từ schema.**
Mọi bảng PK `uuid default gen_random_uuid()`. Bảng gốc (`students`, `classes`) mang `teacher_id`; bảng con mang `class_id`/`student_id` để RLS suy quyền qua quan hệ. Đặt cột phân quyền ngay từ đầu để không phải migrate lại khi bật RLS.

**4. Migration bằng Supabase CLI, version-controlled.**
Đặt file SQL trong `supabase/migrations/`. Cân nhắc khác: tạo bảng thủ công qua Dashboard — loại vì không reproducible/không review được.

**5. Seed admin thủ công, không seed trong migration.**
Admin gắn với `auth.users` (cần tạo qua Auth), nên tạo user trên Dashboard rồi UPDATE `is_admin = true`. Không nhúng vào migration để tránh phụ thuộc vào user id cụ thể.

**6. Database trigger tự tạo row `teachers` khi user mới xác nhận — không dùng Edge Function.**
Invite giáo viên qua Dashboard (Auth → Invite user); khi giáo viên xác nhận email, trigger `on_auth_user_created` (AFTER INSERT ON auth.users, SECURITY DEFINER) tự INSERT row vào `teachers` với `name = ''` để giáo viên tự đặt sau khi đăng nhập. Cân nhắc khác: Edge Function `invite-teacher` dùng `service_role` key — phức tạp hơn (Deno, deploy, cold start), không cần thiết khi chỉ có 5 giáo viên và admin có thể vào Dashboard. Trigger đơn giản hơn và không lộ key ra ngoài Supabase.

## Risks / Trade-offs

- **Schema sai/thiếu cột phải migrate lại** → đối chiếu kỹ entity trong `src/store/db.js` trước khi viết migration; liệt kê đủ 17 bảng trong proposal.
- **FK tới `auth.users` ràng buộc thứ tự tạo** → `teachers` phải tạo sau khi user tồn tại; seed admin tách khỏi migration giải quyết việc này.
- **Supabase free tier pause sau 7 ngày không activity** → chấp nhận ở giai đoạn này; cron giữ project là tùy chọn ở change cuối.
- **Chưa có RLS = bảng mở** → chấp nhận tạm vì chưa có client/credentials public; RLS bật ngay ở change kế trước khi tích hợp client.

## Migration Plan

1. Tạo Supabase project, lấy URL + anon key, ghi vào `.env` + `.env.example`.
2. `supabase init` (nếu chưa), viết migration `teachers` rồi migration các bảng nghiệp vụ.
3. `supabase db push` (hoặc chạy qua Dashboard SQL editor) áp migration.
4. Tạo 1 user admin qua Dashboard Auth, INSERT/UPDATE row `teachers` với `is_admin = true`.
5. Verify: liệt kê bảng, kiểm tra UUID PK + cột phân quyền tồn tại.

Rollback: drop schema / xóa migration; vì chưa có dữ liệu thật, rollback an toàn.

## Open Questions

- Dùng `supabase db push` qua CLI hay paste SQL vào Dashboard SQL editor? (CLI ưu tiên nếu cài được trên máy Windows này.)
- Có tách enum/lookup (vd trạng thái điểm danh, loại phí) thành type riêng hay để text + check constraint? Đề xuất: text + CHECK cho đơn giản giai đoạn đầu.
