## Why

App đã hoàn tất migration Supabase với RLS đầy đủ và build production chạy được, nhưng còn thiếu các lớp an toàn vận hành và onboarding cần thiết trước khi giao cho người dùng thật (giáo viên không rành kỹ thuật): chưa có khôi phục lỗi runtime (một lỗi render = màn hình trắng), chưa có "quên mật khẩu" tự phục vụ, tài liệu lỗi thời, và chưa có runbook cho các bước cấu hình Supabase bắt buộc (bootstrap admin, URL redirect, tắt tự đăng ký, backup).

## What Changes

- Thêm **ErrorBoundary** bọc toàn app: lỗi render hiển thị màn hình khôi phục tiếng Việt + nút "Tải lại", thay vì trắng màn hình.
- Thêm luồng **"Quên mật khẩu"** trên trang đăng nhập (gửi email reset qua Supabase, dùng lại flow `recovery` đã có trong `useAuth`).
- Thêm **fallback cho `selectedClassId` rác**: khi lớp đã lưu trong localStorage không còn truy cập được, app quay về danh sách lớp thay vì kẹt loading/lỗi.
- **Lazy-load** thư viện export nặng (`xlsx`, `jspdf`, `html2canvas`) để giảm bundle khởi động (~1.88 MB hiện tại).
- Cập nhật **README.md** cho khớp trạng thái thực (migration đã xong, không còn localStorage/db.js) và thêm **`.env.example`**.
- Thêm **runbook triển khai production** (`docs/DEPLOYMENT.md` hoặc tương đương): các bước **thủ công** trên Supabase Dashboard mà code không làm thay được — bootstrap admin + `is_admin`, cấu hình Site URL/Redirect URLs, tắt tự đăng ký, bật backup, và kịch bản kiểm thử bằng tài khoản giáo viên thường.
- Dọn **IMPROVEMENTS.md** (đánh dấu mục đã hoàn tất).

## Capabilities

### New Capabilities
- `error-handling`: App bắt lỗi render runtime ở cấp toàn cục và hiển thị giao diện khôi phục thay vì màn hình trắng.
- `production-deployment`: Yêu cầu vận hành/cấu hình bắt buộc để triển khai an toàn (bootstrap admin, cấu hình Auth URL, chặn tự đăng ký, backup dữ liệu, kiểm thử phân quyền) — ghi lại dưới dạng runbook có thể kiểm tra.

### Modified Capabilities
- `authentication`: Bổ sung yêu cầu khôi phục mật khẩu tự phục vụ ("quên mật khẩu") qua email reset của Supabase.

## Impact

- **Code:** `src/main.jsx` (bọc ErrorBoundary), thêm `src/components/ErrorBoundary.jsx`; `src/pages/LoginPage.jsx` (+ link/luồng reset), có thể `src/hooks/useAuth.jsx` (helper `requestPasswordReset`); `src/App.jsx` + `src/pages/ClassDetailPage/` (fallback class); các nút export trong `src/components/reports/*` và nơi gọi `xlsx`/`jspdf`/`html2canvas` (dynamic import).
- **Tài liệu:** `README.md`, `.env.example` (mới), `docs/DEPLOYMENT.md` hoặc `openspec` runbook (mới), `IMPROVEMENTS.md`, và cập nhật `CLAUDE.md` nếu kiến trúc đổi.
- **Hạ tầng (thủ công, ngoài code):** cấu hình Supabase Auth (Site URL, Redirect URLs, tắt signup), set `is_admin` qua SQL Editor, bật backup. Không có thay đổi schema/migration mới.
- **Phụ thuộc:** không thêm package mới.
