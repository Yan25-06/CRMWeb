## Why

Tab "Nhận Xét" hiện vẫn là placeholder. Giáo viên cần một hệ thống nhận xét chuyên nghiệp để theo dõi năng lực học sinh qua biểu đồ radar, ghi nhận nhận xét nhanh từng buổi học, và xuất phiếu kết quả gửi phụ huynh. Đây là cầu nối thông tin quan trọng giữa giáo viên và phụ huynh, giúp cá nhân hóa lộ trình học tập.

## What Changes

- Thay thế `ReviewsPage` placeholder bằng module **Nhận Xét Học Sinh** đầy đủ.
- **Biểu đồ Radar năng lực** (chart.js): Chấm điểm 4 kỹ năng (Nghe, Nói, Đọc, Viết) theo từng đợt, overlay nhiều tháng để theo dõi tiến bộ.
- **Quick Tag Editor**: Nhãn nhận xét soạn sẵn (tích cực/cần cố gắng) — giáo viên click nhanh thay vì gõ thủ công.
- **Giao diện chọn học viên**: Chọn lớp → chọn học viên → xem/tạo nhận xét.
- **Report Card Generator**: Xuất phiếu kết quả dạng ảnh/PDF chuyên nghiệp (logo, bảng điểm, biểu đồ, lời khuyên) gửi phụ huynh.
- Mở rộng data model `phf_reviews` thêm fields: `readScore`, `listenScore`, `tags[]`, `advice`.
- Sử dụng `phf_session_reviews` cho nhận xét nhanh hàng ngày.

## Capabilities

### New Capabilities
- `radar-chart-assessment`: Biểu đồ radar 4 kỹ năng (chart.js), overlay nhiều tháng, form chấm điểm.
- `quick-tag-editor`: Hệ thống nhãn nhận xét soạn sẵn, click để tạo câu nhận xét tổng hợp.
- `review-report-card`: Xuất phiếu kết quả chuyên nghiệp (ảnh/PDF) chứa logo, biểu đồ, điểm, lời khuyên.
- `student-review-page`: Trang chính Nhận Xét — chọn lớp, chọn học viên, xem lịch sử nhận xét.

### Modified Capabilities
- `pages`: ReviewsPage thay thế placeholder bằng module Nhận Xét đầy đủ.
- `data`: Mở rộng ReviewRecord thêm `readScore`, `listenScore`, `tags`, `advice`. Bổ sung query helpers.

## Impact

- **Pages**: `PlaceholderPages.jsx` → export `ReviewsPage` sẽ bị loại bỏ, thay bằng `ReviewsPage.jsx` mới.
- **Components**: Thêm mới `components/reviews/` (RadarChart, QuickTagEditor, ReviewForm, ReviewHistory, ReportCard).
- **Data layer**: Mở rộng `phf_reviews` schema + thêm helpers query. Sử dụng `phf_session_reviews` đã có.
- **Dependencies**: Dùng `chart.js` (đã có), `html2canvas` + `jspdf` (đã có trong project) cho xuất PDF.
- **App.jsx**: Cập nhật route import cho ReviewsPage.
