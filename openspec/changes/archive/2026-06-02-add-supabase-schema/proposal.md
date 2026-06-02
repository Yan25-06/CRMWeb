## Why

App hiện lưu toàn bộ dữ liệu trong localStorage (`src/store/db.js`), chỉ một giáo viên/một trình duyệt dùng được. Bước nền tảng cho mô hình nhiều giáo viên là dựng một backend quan hệ (Supabase/PostgreSQL) với schema cho toàn bộ entity — mọi change sau (auth, RLS, service layer, admin panel) đều phụ thuộc vào schema này.

## What Changes

- Tạo Supabase project (free tier) và lưu credentials vào `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Viết migration tạo bảng `teachers` liên kết 1-1 với `auth.users` qua `id` (email, name, is_admin).
- Viết migration tạo toàn bộ bảng nghiệp vụ: students, classes, enrollments, sessions, attendance, homeworks, fees, payments, reviews, session_reviews, mock_tests, mock_test_results, hw_assignments, submissions, general_comments, settings, schedule.
- Mỗi bảng dùng khóa chính UUID; gắn cột phân quyền `teacher_id`/`class_id`/`student_id` để các change sau (RLS, service layer) suy quyền sở hữu.
- Seed thủ công 1 tài khoản admin qua Supabase Dashboard, set `is_admin = true`.

Phạm vi change này **chỉ là schema + project setup**. KHÔNG bao gồm: bật RLS, client integration, auth UI, service layer, admin panel — các phần đó nằm ở những change tiếp theo trong lộ trình.

## Capabilities

### New Capabilities
- `backend-data`: Schema PostgreSQL (Supabase) cho toàn bộ entity với UUID PK và các cột phân quyền. (Các change sau sẽ bổ sung thêm requirement service layer và optimistic UI vào cùng capability này.)

### Modified Capabilities
<!-- Không có. Tầng localStorage hiện tại vẫn nguyên cho tới change cutover (#9). -->

## Impact

- **Dependencies**: chưa thêm package client ở change này (để ở change `add-auth-login`); chỉ cần Supabase CLI để chạy migration.
- **Infra**: một Supabase project mới (free tier), thư mục `supabase/migrations/` chứa các migration tạo bảng, một admin row seed thủ công.
- **Env**: thêm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` vào `.env` và `.env.example`.
- **Code**: chưa đụng `src/` — `src/store/db.js` và localStorage vẫn là nguồn dữ liệu hiện hành cho tới khi service layer cutover.
