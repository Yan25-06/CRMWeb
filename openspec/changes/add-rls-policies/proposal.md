## Why

Schema đã có (`add-supabase-schema`) và app đã có đăng nhập + session thật (`add-auth-login`), nhưng các bảng hiện đang mở — bất kỳ ai có anon key đều đọc/ghi được mọi dữ liệu. Cần bật Row Level Security ở PostgreSQL để phân tách dữ liệu giữa các giáo viên và enforce admin chỉ-đọc, ngay trước khi service layer bắt đầu đọc/ghi qua Supabase.

## What Changes

- Bật RLS trên tất cả bảng nghiệp vụ và bảng `teachers`.
- Policy cho `teachers`: mỗi user đọc được (và cập nhật `name` của) chính profile mình; admin đọc tất cả. (Bắt buộc để `useAuth` nạp được profile sau khi RLS bật.)
- Policy SELECT: teacher thấy lớp/học sinh của mình (`teacher_id = auth.uid()`); bảng con suy quyền qua `class_id`/`student_id`; admin thấy tất cả.
- Policy INSERT/UPDATE/DELETE: chỉ teacher trên dữ liệu của mình; **KHÔNG cấp policy ghi cho admin** trên bảng nghiệp vụ → admin read-only enforce ở DB.
- Policy cho `classes`: phần "admin tạo & giao lớp" tạm xử lý ở giai đoạn này bằng cách cho admin INSERT/UPDATE `classes` (ngoại lệ ghi duy nhất của admin); teacher chỉ UPDATE nội dung lớp được giao. (UI tạo/giao lớp nằm ở `add-admin-panel`.)
- Helper function `is_admin()` (SECURITY DEFINER) để policy kiểm tra vai trò mà không đệ quy RLS trên `teachers`.

Phạm vi change này **chỉ là RLS + policy + test phân tách**. KHÔNG gồm: service layer, UI admin, thay `db.js`.

## Capabilities

### New Capabilities
- `authorization`: Hai vai trò admin/teacher; phân tách dữ liệu bằng RLS theo lớp được giao + ownership học sinh; admin read-only enforce bằng việc không cấp policy ghi; ngoại lệ admin tạo/giao lớp.

### Modified Capabilities
<!-- Không có. `authentication` đã xong ở change trước; ở đây chỉ thêm policy hỗ trợ, không đổi requirement auth. -->

## Impact

- **Infra/DB**: migration mới trong `supabase/migrations/` bật RLS + tạo policy + helper `is_admin()`. Không đổi schema cột.
- **Code**: không thêm code `src/` mới; nhưng phụ thuộc `useAuth` (từ #2) đọc `teachers` — cần policy self-read để không vỡ login.
- **Phụ thuộc lộ trình**: cần `add-supabase-schema` (bảng + cột phân quyền) và `add-auth-login` (session thật để test A/B + admin). Là tiền đề an toàn cho mọi change service layer (#4–#9).
- **Rủi ro**: policy sai có thể khóa toàn bộ truy cập hoặc rò rỉ dữ liệu — cần bộ test phân tách kỹ ở task cuối.
