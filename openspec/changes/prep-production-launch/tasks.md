## 1. ErrorBoundary (khôi phục lỗi runtime)

- [ ] 1.1 Tạo `src/components/ErrorBoundary.jsx` (class component, `getDerivedStateFromError` + `componentDidCatch` có `console.error` stack)
- [ ] 1.2 UI khôi phục dùng token Navy, thông báo tiếng Việt + nút "Tải lại trang" gọi `window.location.reload()`
- [ ] 1.3 Bọc `<AuthGate/>` bằng `<ErrorBoundary>` trong `src/main.jsx`
- [ ] 1.4 Kiểm chứng: tạm ném lỗi trong một component để thấy màn hình khôi phục, rồi gỡ bỏ

## 2. Quên mật khẩu (tự phục vụ)

- [ ] 2.1 Thêm helper `requestPasswordReset(email)` vào `src/hooks/useAuth.jsx` gọi `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + import.meta.env.BASE_URL })`
- [ ] 2.2 `src/pages/LoginPage.jsx`: thêm chế độ "Quên mật khẩu" (toggle trong cùng trang) — form nhập email + nút gửi
- [ ] 2.3 Validate email hợp lệ trước khi gọi; hiển thị thông báo xác nhận chung (không tiết lộ email tồn tại hay không); xử lý loading + lỗi
- [ ] 2.4 Kiểm chứng dev: bấm gửi với email hợp lệ → nhận thông báo xác nhận; mở link recovery → vào `SetPasswordPage`

## 3. Fallback selectedClassId rác

- [ ] 3.1 `src/pages/ClassDetailPage/index.jsx`: khi load class trả về null hoặc lỗi quyền, gọi `onBack()` để xóa id và quay về danh sách lớp (không kẹt loading)
- [ ] 3.2 Kiểm chứng: đặt `localStorage.selectedClassId` = id không tồn tại rồi tải lại → app về danh sách lớp

## 4. Lazy-load thư viện export (giảm bundle)

- [ ] 4.1 Đổi import tĩnh `xlsx` sang `await import('xlsx')` trong các handler export (reports + students directory + mock test export trong `src/utils/mockTestExport.js`)
- [ ] 4.2 Đổi import tĩnh `jspdf` + `html2canvas` sang dynamic import trong `src/components/reports/ExportPdfButton.jsx` và nơi xuất PDF phiếu học phí
- [ ] 4.3 Bọc try/catch + toast lỗi tiếng Việt quanh phần export động
- [ ] 4.4 `npm run build` và xác nhận bundle chính giảm rõ rệt + chunk động xuất hiện

## 5. Tài liệu (README, .env.example, IMPROVEMENTS)

- [ ] 5.1 Cập nhật `README.md`: bỏ phần localStorage/db.js, sửa roadmap thành "migration hoàn tất", cập nhật cây thư mục + danh sách trang (admin, students) cho khớp thực tế
- [ ] 5.2 Tạo `.env.example` với 2 biến `VITE_SUPABASE_URL=` và `VITE_SUPABASE_ANON_KEY=` (giá trị rỗng/placeholder)
- [ ] 5.3 Rà `IMPROVEMENTS.md`: đánh dấu/loại các mục đã hoàn tất

## 6. Runbook triển khai production (DEPLOYMENT.md)

- [ ] 6.1 Tạo `DEPLOYMENT.md` ở root (KHÔNG đặt trong `docs/` vì là output build) — mục lục các bước go-live
- [ ] 6.2 Mục "Dữ liệu sạch + bootstrap admin": cảnh báo KHÔNG chạy seed mock lên production; quy trình invite admin + lệnh SQL set `is_admin = true` qua SQL Editor
- [ ] 6.3 Mục "Cấu hình Supabase Auth": đặt Site URL + Redirect URLs trỏ domain GitHub Pages; tắt tự đăng ký (signup)
- [ ] 6.4 Mục "Sao lưu": bật daily backup / PITR trước khi nhập liệu thật
- [ ] 6.5 Mục "Kiểm thử phân quyền": kịch bản đăng nhập bằng tài khoản giáo viên thường, xác nhận read-only students/mock_tests nhưng vẫn ghi điểm/điểm danh/bài tập
- [ ] 6.6 Mục "Build & Deploy": lệnh `npm run build` → `docs/` → push → GitHub Pages

## 7. Đồng bộ tài liệu kiến trúc

- [ ] 7.1 Cập nhật `CLAUDE.md` (ErrorBoundary, luồng reset mật khẩu, runbook) và liên kết `DEPLOYMENT.md` nếu cần
- [ ] 7.2 Build cuối + smoke test: đăng nhập, điều hướng các trang, thử 1 export, xác nhận không lỗi console nghiêm trọng

## 8. Bàn giao phần thủ công (sau apply)

- [ ] 8.1 Tổng hợp và giải thích cho người dùng các bước THỦ CÔNG trên Supabase Dashboard không thể tự động hóa (mục 6.2–6.4) và lý do từng bước
