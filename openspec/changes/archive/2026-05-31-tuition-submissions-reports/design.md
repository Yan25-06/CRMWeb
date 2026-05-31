## Context

App là PWA single-user (1 giáo viên) chạy hoàn toàn local — không backend, dữ liệu nằm trong `localStorage` qua data layer ở `src/store/` (hoặc tương tự, dùng các key `phf_*`). Stack: React 18 + Vite + Tailwind, Chart.js cho biểu đồ, XLSX cho Excel, html2canvas + canvas-to-pdf cho PDF.

Tab "Học Phí" (`FeesPage`) hiện là placeholder. Sub-tab "Bài Tập" trong `ClassDetailPage` đã có khung và đang phát triển `HomeworkSummaryFooter.jsx`. Tab "Báo Cáo" chưa có. Cả 3 tính năng đều mở rộng từ data → page → UI, không động đến infra/auth.

## Goals / Non-Goals

**Goals:**
- Học phí: theo dõi từng lần thu (số tiền, ngày, hình thức), trạng thái đã/chưa đóng theo tháng, tổng thu + danh sách nợ.
- Nộp bài: gắn liền với mỗi bài tập trong từng lớp — bảng học viên × trạng thái nộp + điểm + nhận xét.
- Báo cáo: 3 loại core (điểm danh tháng, tiến độ Mock Test, tổng thu học phí) + xuất Excel/PDF.
- Tận dụng dependency hiện có; migrate dữ liệu cũ tự động (chỉ thêm field default).

**Non-Goals:**
- Multi-user / auth / role.
- Học viên đăng nhập tự nộp file thật (upload).
- Hóa đơn điện tử / kết nối ngân hàng / thanh toán online.
- Nhắc nợ tự động qua SMS/email.
- Báo cáo realtime hoặc sync server.

## Decisions

### 1. Lưu khoản thu học phí thành record riêng (`phf_payments`)
Thay vì cộng dồn vào field trên Student, mỗi lần thu là 1 record `{id, studentId, classId, amount, paidAt, method, period, note}`. Lý do: cần truy ngược lịch sử (ai đã đóng tháng nào, hình thức gì), và báo cáo doanh thu cần group theo tháng — record-based dễ hơn nhiều so với mảng lồng trong Student.
**Alternative:** Lưu mảng `payments[]` lồng trong Student → loại vì khó query cross-student cho báo cáo.

### 2. Tách `phf_homework` (định nghĩa bài tập) và `phf_submissions` (nộp + điểm)
Một bài tập có nhiều học viên, mỗi học viên có 1 submission. Submission: `{id, homeworkId, studentId, submitted, score, comment, gradedAt}`. Lý do: bài tập là tài sản của lớp, submission là tài sản của học viên — separation tự nhiên, dễ tính summary (X/Y học viên đã nộp).
**Alternative:** Lưu submissions lồng vào homework → loại vì khó truy theo học viên (StudentDetailPanel muốn list tất cả bài tập của 1 em).

### 3. Nộp bài giữ trong sub-tab "Bài Tập", không tách tab chính
Đã thống nhất với user. Mở rộng `HomeworkTab` thành 2 view: (a) Danh sách bài tập (đã có), (b) Bảng nộp bài/chấm điểm khi chọn 1 bài. Toggle bằng tab phụ hoặc khi click vào bài tập.

### 4. ReportsPage là dashboard read-only, dùng selector + Chart.js
3 card chính: Điểm Danh (line/bar theo tháng), Mock Test (line theo thời gian, filter theo học viên/lớp), Học Phí (bar tổng thu + list nợ). Mỗi card có nút "Xuất Excel" và "Xuất PDF" độc lập.
**Alternative:** Một export duy nhất full-report → loại vì giáo viên thường chỉ cần 1 loại tại 1 thời điểm.

### 5. Excel dùng `xlsx`, PDF dùng `jsPDF` + `html2canvas`
Excel: build sheet trực tiếp từ data (đã quen pattern trong app). PDF: thêm dependency `jspdf` (~150KB gzip), dùng `html2canvas` chụp DOM card → embed ảnh vào PDF → trigger download tự động. Lý do chọn jsPDF thay vì `window.print()`: UX 1-click nhất quán với nút "Xuất Excel", control được filename, in đúng 1 card được chọn. Trade-off: PDF là bitmap (text không copy được), nhưng use case là gửi phụ huynh xem/in nên chấp nhận được.
**Alternative đã loại:** `window.print()` (zero dep) — bị loại vì UX yếu (phải qua dialog in của browser, khó in đúng 1 card, không control filename). Server-side PDF — không có backend.

### 7. Homework `dueDate` optional với smart default
Field `dueDate` không bắt buộc trong schema, nhưng form "Thêm bài tập" có default `assignedAt + 7 ngày`. Giáo viên có thể giữ default, chỉnh, hoặc clear. Lý do: cân bằng giữa linh hoạt (bài không cần deadline) và hữu ích (báo cáo "quá hạn chưa nộp" luôn có data để chạy).
**Alternative đã loại:** Bắt buộc — cứng nhắc với bài không có deadline tự nhiên. Optional thuần (không default) — giáo viên dễ bỏ trống → mất tính năng cảnh báo quá hạn.

### 6. Migration nhẹ, lazy, không version-bump
Khi đọc record cũ thiếu field mới (vd `Student.feePerSession` không có), gán default. Không cần migration script chạy 1 lần — đọc-thì-bù. Lý do: app single-user, dataset nhỏ, không cần versioning phức tạp.

## Risks / Trade-offs

- **Risk:** Dữ liệu học phí có thể lệch nếu giáo viên xóa Student → orphan Payment records.
  **Mitigation:** Khi xóa Student, cascade-xóa hoặc archive Payment liên quan, hỏi confirm.
- **Risk:** Báo cáo Mock Test theo thời gian cần dữ liệu lịch sử đủ dày — tháng đầu sẽ trống.
  **Mitigation:** Empty state rõ ràng, hint "Cần ít nhất 2 mốc Mock Test để vẽ tiến độ".
- **Risk:** Xuất PDF qua html2canvas có thể vỡ layout với card dài.
  **Mitigation:** CSS print-only cho ReportsPage; test với data thật trước khi ship.
- **Trade-off:** Submission lưu thành record riêng tốn nhiều entry hơn → chấp nhận vì dataset 1 giáo viên không lớn (<10k records).
- **Trade-off:** Không có migration version → nếu schema thay đổi lớn sau này phải viết tay script. Hiện tại ưu tiên simple.

## Migration Plan

1. Bổ sung storage keys `phf_payments`, `phf_homework`, `phf_submissions` (nếu chưa có) với default `[]`.
2. Code đọc record cũ phải tolerant missing fields — gán default tại load time.
3. Không cần migration script một lần. Triển khai trên cùng branch, deploy đồng thời.
4. **Rollback:** Revert commit; dữ liệu mới trong keys mới không ảnh hưởng key cũ — an toàn rollback.

## Open Questions

- Có cần nhập học phí mặc định theo lớp (thay vì theo học viên) không? — Hiện theo Student (`feePerSession`), giữ nguyên.

## Resolved

- **PDF library**: dùng `jspdf` + `html2canvas` (thêm dep ~150KB, UX 1-click nhất quán). Xem Decision 5.
- **Homework `dueDate`**: optional với smart default = `assignedAt + 7 ngày`. Xem Decision 7.
