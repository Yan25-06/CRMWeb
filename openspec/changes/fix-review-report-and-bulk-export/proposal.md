## Why

Phần đánh giá học viên có 4 lỗi/thiếu sót làm giảm chất lượng phiếu gửi phụ huynh: biểu đồ radar vô nghĩa khi lớp có dưới 3 kỹ năng, tên giáo viên luôn hiển thị `—`, bảng điểm phiếu kết quả không lấy đúng thang điểm tối đa, và không có cách xuất phiếu hàng loạt cho cả lớp. Gom xử lý cùng một lượt vì cùng chạm vào luồng đánh giá/xuất phiếu.

## What Changes

- **RadarChartPanel** fallback sang **grouped bar chart** khi lớp có `< 3` kỹ năng (radar 2 trục chỉ là một đường thẳng, vô nghĩa). Từ `>= 3` kỹ năng giữ nguyên radar.
- **Sửa lỗi tên giáo viên `—`**: `ReviewsPage` lấy tên giáo viên từ `useAuth().teacher.name` (không còn `settings.teacherName` đã bị xóa khỏi service layer) và truyền vào `ReviewForm` + `ReportCardModal`.
- **ReportCardModal**: bảng điểm kỹ năng lấy `maxScore` từ `latestReview.scoreMax[skill.name] ?? 9` (đồng bộ với `RadarChartPanel`/`ReviewForm`) thay vì `skill.maxScore` (đã bỏ khỏi `skillConfig`); hiển thị `{score}/{maxScore}` đúng.
- **Xuất phiếu hàng loạt**: nút "Xuất Tất Cả" ở `ReviewsPage` render phiếu PNG của tất cả học sinh có đánh giá trong kỳ lọc → đóng gói `.zip` (thêm dependency `jszip`), kèm modal progress.

## Capabilities

### New Capabilities
<!-- Không có capability mới -->

### Modified Capabilities
- `pages`: thêm/sửa requirement cho `RadarChartPanel` (fallback bar chart), `ReportCardModal` (nguồn `maxScore` + tên giáo viên) và `ReviewsPage` (xuất phiếu hàng loạt zip).

## Impact

- **Components/Pages**: `src/components/reviews/RadarChartPanel.jsx`, `src/components/reviews/ReportCardModal.jsx`, `src/pages/ReviewsPage.jsx`, thêm mới `src/components/reviews/BulkExportModal.jsx`.
- **Dependencies**: thêm `jszip` (lazy import trong handler); `html2canvas` đã có (lazy import). Chart.js cần register thêm `BarController`, `CategoryScale`, `LinearScale`, `BarElement`.
- **Không đổi**: data model, service layer, schema, seed.
