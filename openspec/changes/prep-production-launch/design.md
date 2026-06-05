## Context

App đã hoàn tất migration Supabase, RLS phủ 19 bảng, build production OK. Đây là change "đóng gói trước go-live": thêm lớp an toàn runtime, onboarding tự phục vụ, tài liệu, và runbook cho các bước Supabase thủ công. Ràng buộc: không thêm dependency mới, không đổi schema, tuân thủ design system Navy + service layer trong `CLAUDE.md`. Người dùng cuối không rành kỹ thuật → ưu tiên thông báo tiếng Việt rõ ràng.

## Goals / Non-Goals

**Goals:**
- App không bao giờ rơi vào màn hình trắng do lỗi render.
- Giáo viên tự khôi phục mật khẩu không cần admin.
- Tài liệu (README, .env.example) khớp thực tế; runbook chỉ rõ bước thủ công.
- Giảm thời gian tải lần đầu bằng lazy-load thư viện export.

**Non-Goals:**
- Không thêm test runner/linter/CI (ngoài phạm vi, ghi nhận là việc tương lai).
- Không đổi RLS/schema/migration.
- Không refactor routing sang react-router.
- Không tự động hóa các bước Supabase Dashboard (về bản chất là thủ công).

## Decisions

- **ErrorBoundary là class component** đặt tại `src/components/ErrorBoundary.jsx`, bọc `<App/>` trong `main.jsx` (bên trong `AuthProvider` để vẫn còn context nếu cần, nhưng bọc cả `AuthGate`). React chỉ hỗ trợ error boundary qua class (`componentDidCatch`/`getDerivedStateFromError`) — đây là ngoại lệ hợp lệ với quy tắc "chỉ functional component". UI khôi phục dùng token Navy, nút "Tải lại" gọi `window.location.reload()`.
- **Quên mật khẩu dùng `supabase.auth.resetPasswordForEmail(email, { redirectTo })`**. Thêm helper `requestPasswordReset(email)` vào `useAuth` để component không gọi `supabase.*` trực tiếp (trừ auth — vốn đã là ngoại lệ cho phép). `redirectTo` = `window.location.origin + import.meta.env.BASE_URL`. LoginPage thêm 1 chế độ "quên mật khẩu" (toggle trong cùng trang) để tránh tạo route mới. Flow `recovery` khi mở link đã được `useAuth` xử lý sẵn (`INVITE_FLOW` bắt `type=recovery`) → `SetPasswordPage`.
  - **Chống dò tài khoản:** luôn hiện thông báo xác nhận chung bất kể email có tồn tại — Supabase cũng không tiết lộ.
- **Fallback `selectedClassId`:** xử lý ở `ClassDetailPage` — khi load class trả về null/lỗi quyền, gọi `onBack()` để xóa id và quay về danh sách. Tránh thêm logic kiểm tra ở `App.jsx` (giữ App mỏng).
- **Lazy-load export:** đổi `import` tĩnh `xlsx`/`jspdf`/`html2canvas` thành `await import()` bên trong handler export. Không cần `manualChunks` — Vite tự tách chunk động. Giảm bundle khởi động đáng kể vì các lib này chỉ chạy khi người dùng bấm xuất.
- **Runbook ở `docs/DEPLOYMENT.md`** (markdown, không phải trong `docs/` build output — dùng đường dẫn riêng để không bị `vite build` ghi đè; chọn `DEPLOYMENT.md` ở root hoặc `openspec/`). Quyết định: đặt ở **root `DEPLOYMENT.md`** để tránh xung đột với thư mục build `docs/`.

## Risks / Trade-offs

- **`docs/` là output build** → đặt runbook trong `docs/` sẽ bị xóa mỗi lần build. → Mitigation: đặt runbook tại `DEPLOYMENT.md` ở root.
- **Lazy-load đổi thời điểm lỗi import** (nếu lib lỗi, lỗi xảy ra lúc bấm xuất chứ không phải lúc tải app). → Mitigation: bọc try/catch + toast lỗi trong handler export (phần lớn đã có `console.error`).
- **resetPasswordForEmail cần Redirect URL đúng** mới hoạt động trên production. → Mitigation: runbook nêu rõ; ở dev mặc định localhost vẫn chạy.
- **ErrorBoundary che mất lỗi khi dev.** → Mitigation: vẫn `console.error` stack trong `componentDidCatch` để debug.

## Migration Plan

1. Triển khai code (ErrorBoundary, reset mật khẩu, fallback, lazy-load, tài liệu).
2. Build + deploy `docs/` lên GitHub Pages.
3. Thực hiện runbook thủ công trên Supabase (bootstrap admin, Auth URL, tắt signup, backup).
4. Kiểm thử bằng tài khoản giáo viên thường.
- **Rollback:** thuần code, revert commit; không có thay đổi DB nên không cần rollback schema.

## Open Questions

- Có cần trang "đặt lại mật khẩu" tách riêng khỏi `SetPasswordPage` không? Hiện tái dùng `SetPasswordPage` cho cả invite lẫn recovery — đủ dùng, giữ nguyên.
