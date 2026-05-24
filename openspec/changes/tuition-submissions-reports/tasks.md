## 1. Data layer

- [x] 1.1 Thêm 3 storage keys `phf_payments`, `phf_homework`, `phf_submissions` với default `[]` trong data layer (`src/store/` hoặc tương đương)
- [x] 1.2 Thêm CRUD helpers cho Payment: `getPayments`, `getPaymentsByStudent`, `getPaymentsByPeriod`, `createPayment`, `deletePayment`
- [x] 1.3 Thêm CRUD helpers cho Homework: `getHwAssignmentsByClass`, `createHwAssignment`, `updateHwAssignment`, `deleteHwAssignment`
- [x] 1.4 Thêm CRUD helpers cho Submission: `getSubmissionsByAssignment`, `getSubmissionsByStudent`, `upsertSubmission`, `deleteSubmissionsByAssignment`
- [x] 1.5 Tolerance: `get()` helper trả về fallback khi key chưa có — tự động an toàn cho record mới
- [x] 1.6 Cascade: deleteStudent cascade xóa Payment + Submission; deleteHwAssignment cascade xóa Submission; deleteClass cascade xóa HW assignments + Submissions + Payments

## 2. Học Phí (FeesPage)

- [x] 2.1 Tạo component `PaymentModal` (form: học viên, số tiền, ngày, hình thức, tháng áp dụng, ghi chú) với validate
- [x] 2.2 Tạo component `FeesTable` (cols: Tên, Lớp, Học phí kỳ vọng, Đã đóng, Trạng thái badge, Thao tác)
- [x] 2.3 Tạo `StudentPaymentHistoryPanel` (modal/panel liệt kê lịch sử Payment của 1 học viên)
- [x] 2.4 Rewrite `src/pages/FeesPage.jsx`: header với month selector + nút "Ghi nhận thanh toán", 4 card tổng (Tổng thu, Kỳ vọng, Đã đóng đủ/Tổng, Còn nợ), `FeesTable`
- [x] 2.5 Empty state khi không có học viên trong tháng
- [x] 2.6 Toast success/error cho các thao tác

## 3. Nộp Bài (HomeworkTab mở rộng)

- [x] 3.1 Tạo modal/form "Thêm bài tập" trong HomeworkTab (fields: title, description, assignedAt, dueDate optional với default = `assignedAt + 7 ngày`, có nút "Xóa hạn nộp")
- [x] 3.2 Refactor HomeworkTab: mode toggle "Theo Buổi" / "Bài Giao"; existing SessionView untouched; AssignView mới tách biệt
- [x] 3.3 View A: hiển thị mỗi HwAssignment với tỉ lệ đã nộp X/Y, click row → View B; overdue badge
- [x] 3.4 Tạo component `SubmissionTable` (cols: Tên, Đã nộp checkbox, Điểm 0–10, Nhận xét, Cập nhật lúc)
- [x] 3.5 Auto-save on blur + on toggle checkbox; debounce 300ms cho text input; indicator "đã lưu"
- [x] 3.6 Validate điểm: chỉ chấp nhận 0–10 step 0.25; hiện inline error nếu sai
- [x] 3.7 Highlight row chưa nộp (background đỏ nhạt)
- [x] 3.8 Footer summary tính realtime "Đã nộp X/Y · Điểm TB: Z.Z" cho View B

## 4. Báo Cáo (ReportsPage)

- [x] 4.1 Thêm route + entry "Báo Cáo" vào `Navbar` (sau "Học Phí"), với icon lucide phù hợp (done in Group 5)
- [x] 4.2 Tạo file `src/pages/ReportsPage.jsx` với layout grid 2+1 card
- [x] 4.3 Tạo component generic `ReportCard` (title, filter slot, chart slot, export buttons)
- [x] 4.4 Tạo `ExportExcelButton` dùng `xlsx` (build sheet từ `rows` + `columns`, download)
- [x] 4.5 Thêm dependency `jspdf` vào `package.json`; tạo `ExportPdfButton` dùng `html2canvas` → jsPDF → download
- [x] 4.6 Card "Điểm Danh theo tháng": filter (lớp, khoảng tháng), Chart.js bar tỉ lệ có mặt; export
- [x] 4.7 Card "Tiến độ Mock Test": filter (học viên hoặc lớp), Chart.js line điểm theo thời gian; empty state khi <2 mốc; export
- [x] 4.8 Card "Tổng thu Học Phí": Chart.js bar tổng thu theo tháng + bảng "Học viên còn nợ"; export
- [x] 4.9 Disable nút export khi card chưa có data, kèm tooltip

## 5. Tích hợp & polish

- [x] 5.1 Cập nhật `NAV_ITEMS` để chèn "Báo Cáo" đúng thứ tự (sau Học Phí), active state highlight nhất quán
- [x] 5.2 Confirm dialog cho xóa HwAssignment có cảnh báo cascade xóa submissions
- [x] 5.3 `fmtVND` (Intl.NumberFormat vi-VN) và `fmtDate` (DD/MM/YYYY) thêm vào helpers, dùng xuyên suốt
- [x] 5.4 Style nhất quán: dùng Button, Card, Badge, Modal từ design system navy/white; Tailwind classes theo tokens
- [ ] 5.5 Smoke test thủ công: tạo Payment → thấy trên FeesPage + ReportsPage; tạo Homework → chấm điểm → thấy summary; export Excel + PDF mỗi card
- [ ] 5.6 Test cold start với localStorage rỗng và với data legacy hiện có (đảm bảo không crash)
