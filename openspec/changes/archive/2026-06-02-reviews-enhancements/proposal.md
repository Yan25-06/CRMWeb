## Why

Module Nhận Xét đã hoạt động nhưng còn thiếu 3 mảng quan trọng: giáo viên chưa thể theo dõi chuyên cần + bài tập theo khoảng thời gian lọc, chưa có góc nhìn tổng hợp toàn lớp để so sánh nhanh, và chưa có ô nhận xét chung để ghi tổng kết tự do ngoài tags. Ba tính năng này hoàn thiện chu trình "theo dõi → đánh giá → xuất báo cáo" phục vụ việc thông báo định kỳ tới phụ huynh.

## What Changes

- **DateRangeFilter**: Bộ lọc từ ngày → đến ngày toàn trang, áp dụng đồng thời cho attendance, homework, và reviews.
- **AttendancePanel**: Panel cá nhân hiển thị danh sách buổi học + % chuyên cần trong khoảng ngày lọc.
- **HomeworkPanel**: Panel cá nhân hiển thị danh sách assignments + % hoàn thành trong khoảng ngày lọc.
- **ViewModeToggle**: Toggle [Cá Nhân] | [Tổng Quan Lớp] ở đầu trang ReviewsPage.
- **ClassOverviewTable**: Bảng tổng hợp tất cả học viên (họ tên, % chuyên cần, % bài tập, nhận xét gần nhất), lọc theo DateRangeFilter.
- **ClassPdfExport**: Xuất PDF nhiều trang toàn lớp — mỗi trang = 1 học viên, theo khoảng ngày.
- **GeneralCommentPanel**: Textarea giáo viên soạn nhận xét chung tự do, lưu vào `phf_general_comments`, hiển thị trong PDF cá nhân.
- Cập nhật **ReportCardModal**: bổ sung khoảng ngày, % chuyên cần, % bài tập, và nhận xét chung vào phiếu PDF.

## Capabilities

### New Capabilities
- `date-range-filter`: Component lọc ngày toàn trang, state được lift lên ReviewsPage, truyền xuống tất cả panels.
- `attendance-panel`: Panel cá nhân — danh sách buổi học + tính % chuyên cần từ `phf_attendance`.
- `homework-panel`: Panel cá nhân — danh sách assignments + tính % hoàn thành từ `phf_homework`.
- `class-overview`: Chế độ Tổng Quan Lớp — bảng tổng hợp học viên + xuất PDF nhiều trang.
- `general-comment`: Panel nhận xét chung tự do — textarea, lưu `phf_general_comments`, hiển thị PDF.

### Modified Capabilities
- `review-report-card`: Thêm section % chuyên cần, % bài tập, nhận xét chung, và khoảng ngày vào phiếu PDF.
- `student-review-page`: Thêm ViewModeToggle, DateRangeFilter, AttendancePanel, HomeworkPanel, GeneralCommentPanel vào layout.
- `data`: Thêm data store `phf_general_comments` + helpers; thêm query attendance/homework theo date range.

## Impact

- **Components**: Thêm mới `components/reviews/DateRangeFilter.jsx`, `AttendancePanel.jsx`, `HomeworkPanel.jsx`, `ClassOverviewTable.jsx`, `GeneralCommentPanel.jsx`.
- **Pages**: `ReviewsPage.jsx` cập nhật — thêm viewMode state, DateRangeFilter state, truyền dateRange xuống tất cả panels.
- **Data layer**: Thêm `phf_general_comments` store + `getGeneralComment`, `upsertGeneralComment`. Thêm helpers lọc attendance/homework theo dateRange.
- **ReportCardModal**: Cập nhật layout thêm 3 mục mới (khoảng ngày, stats, nhận xét chung).
- **Dependencies**: Không thêm dependency mới — dùng `html2canvas` + `jspdf` đã có.
