## Context

Luồng đánh giá học viên (`ReviewsPage` + components trong `src/components/reviews/`) đã chuyển sang model `skillConfig` động (`{ name, order }`, không còn `maxScore`) và `reviews.scoreMax` snapshot. Trong quá trình refactor, 3 chỗ còn sót và 1 tính năng còn thiếu (xem `pending-fixes.md`). Các sửa đổi nằm hoàn toàn ở tầng UI — không đụng service/schema.

## Goals / Non-Goals

**Goals:**
- Radar chart không bao giờ vẽ vô nghĩa khi lớp có < 3 kỹ năng.
- Phiếu kết quả luôn hiển thị đúng tên giáo viên và thang điểm tối đa.
- Giáo viên xuất phiếu PNG cả lớp thành 1 file zip.

**Non-Goals:**
- Không thay đổi data model, service layer, RLS, hay seed.
- Không đổi format PNG/PDF của phiếu đơn lẻ hiện có.
- Không xử lý xuất PDF gộp (chỉ PNG-in-zip).

## Decisions

### D1 — Radar fallback: grouped bar chart khi `skills.length < 3`
Ngưỡng `< 3` dứt khoát (radar 2 điểm = đường thẳng). Khi đó render bar chart: trục X = tên kỹ năng, trục Y = 0–100% (cùng phép chuẩn hóa `value / maxScore * 100` như radar), mỗi đợt đánh giá = 1 dataset giữ nguyên `DATASET_COLORS`. Cần register thêm `BarController, CategoryScale, LinearScale, BarElement` cho Chart.js. Giữ nguyên data prep; chỉ rẽ nhánh `type` + scales.
- *Alternative bỏ:* ép tối thiểu 3 trục bằng trục giả → gây hiểu nhầm; hiển thị bảng số → mất tính so sánh trực quan.

### D2 — Nguồn tên giáo viên: `useAuth().teacher.name`
`settingsService` không còn map `teacherName`. `ReviewsPage` thêm `const { teacher } = useAuth()` và truyền `teacherName={teacher?.name}` vào `ReviewForm`, `settings={{ ...settings, teacherName: teacher?.name }}` vào `ReportCardModal`. Khớp với pattern hiển thị danh tính ở `Navbar`/Settings.

### D3 — `maxScore` trong ReportCardModal lấy từ `latestReview.scoreMax`
Thay `skill.maxScore` (đã bỏ khỏi `skillConfig`) bằng `latestReview?.scoreMax?.[skill.name] ?? 9` cho cả phép tính `pct` lẫn hiển thị `{score}/{maxScore}` — đồng bộ với `RadarChartPanel`/`ReviewForm`.

### D4 — Xuất hàng loạt: render tuần tự → html2canvas → JSZip
Component mới `BulkExportModal.jsx`: nhận danh sách học sinh + data, lọc học sinh có `latestReview != null` trong date range đang lọc của trang, render từng card vào hidden div (`position:absolute; left:-9999px; top:0` — không dùng `display:none`), `html2canvas` → blob PNG → `zip.file('phieu-[ten].png', blob)`, cuối cùng `zip.generateAsync({type:'blob'})` tải `phieu-[tenLop]-[ngay].zip`. Cả `html2canvas` và `jszip` lazy import trong handler. Modal hiện progress "Đang tạo phiếu... n / total" + progress bar.
- *Alternative bỏ:* render song song → tốn RAM, html2canvas xung đột layout; nhiều file rời → khó gửi phụ huynh.

## Risks / Trade-offs

- [Bundle phình do `jszip`] → lazy import trong handler, không tăng bundle khởi động.
- [Lớp đông → render lâu/treo UI] → render tuần tự + progress bar phản hồi; chấp nhận chậm vì hiếm khi > vài chục học sinh.
- [`scoreMax` rỗng ở phiếu cũ] → fallback `9` (thang IELTS), nhất quán toàn app.
- [Hidden render div ảnh hưởng layout] → đặt off-screen tuyệt đối, gỡ sau khi xong.
