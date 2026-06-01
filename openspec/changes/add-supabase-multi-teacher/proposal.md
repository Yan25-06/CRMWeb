## Why

App hiện tại lưu toàn bộ dữ liệu trong localStorage của một trình duyệt, nên chỉ một giáo viên trên một máy dùng được — không có tài khoản, không chia sẻ, không quản lý tập trung. Trung tâm cần nhiều giáo viên cùng dùng với tài khoản riêng, dữ liệu tách biệt, và một admin giám sát toàn bộ.

## What Changes

- **BREAKING**: Thay localStorage bằng Supabase (PostgreSQL + Auth). Bắt đầu sạch hoàn toàn — không migrate dữ liệu mock cũ.
- Thêm đăng nhập bằng email/password qua Supabase Auth; mọi trang đều nằm sau cổng xác thực.
- Thêm hai vai trò: **admin** (chỉ quản lý, xem toàn bộ, không sửa) và **teacher** (toàn quyền trên dữ liệu của lớp/học sinh được giao).
- Admin Panel trong app: tạo tài khoản giáo viên (gửi invite email), tạo lớp và giao lớp cho giáo viên, xem read-only toàn bộ dữ liệu.
- Phân tách dữ liệu bằng Row Level Security (RLS) ở tầng PostgreSQL — giáo viên chỉ thấy lớp/học sinh của mình.
- Thêm service layer (`src/services/`) làm lớp trung gian giữa UI và Supabase, để dễ thay backend về sau.
- Edge Function cho luồng admin invite (giữ `service_role` key an toàn phía server).
- Optimistic UI + retry tự động khi mất mạng (online-only, không offline-first).

## Capabilities

### New Capabilities
- `authentication`: Đăng nhập/đăng xuất, quản lý session, luồng invite + đặt mật khẩu lần đầu cho giáo viên.
- `authorization`: Vai trò admin/teacher, RLS phân tách dữ liệu, quy tắc admin read-only và teacher full-CRUD theo lớp được giao.
- `backend-data`: Schema PostgreSQL cho toàn bộ entity, service layer thay localStorage, optimistic UI + retry.
- `admin-panel`: Trang quản lý của admin — tạo tài khoản giáo viên, tạo & giao lớp, xem read-only.

### Modified Capabilities
- `data`: Tầng dữ liệu localStorage được thay thế hoàn toàn bằng Supabase; các storage key và truy cập trực tiếp `db.js` không còn là nguồn dữ liệu chính.

## Impact

- **Code**: `src/store/db.js` (thay bằng service layer), toàn bộ component đang import `db.js`, thêm `src/lib/supabase.js`, `src/services/`, `src/hooks/useAuth.js`, routing có `ProtectedRoute`, trang Login & Admin Panel.
- **Dependencies**: thêm `@supabase/supabase-js`; biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Infra**: Supabase project (free tier), schema migrations + RLS policies, một Edge Function cho invite.
- **Entities ảnh hưởng**: teachers, students, classes, enrollments, sessions, attendance, homeworks, fees, payments, reviews, session_reviews, mock_tests, mock_test_results, hw_assignments, submissions, general_comments, settings, schedule.
