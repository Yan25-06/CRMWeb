## Why

`ReportsPage` hiện mỗi card có selector lớp riêng — đổi lớp phải lặp lại ở từng card, dễ lệch ngữ cảnh giữa các biểu đồ. Card Mock Test giới hạn cứng 5 học sinh (`slice(0,5)`) nên không xem được cả lớp đông. Biểu đồ không click được để xem chi tiết. Và thiếu một góc nhìn quan trọng: tiến độ nộp bài tập. Đây là nhóm thay đổi tập trung vào `ReportsPage`, refactor cấu trúc trang nên gom riêng để review kỹ.

## What Changes

- **C5** `ReportsPage`: thêm **bộ chọn lớp chung ở đầu trang** áp dụng cho tất cả biểu đồ, thay cho selector riêng từng card. (Filter khoảng tháng / học viên giữ ở card nếu đặc thù.)
- **C2** `ReportsPage → MockTestCard`: bỏ giới hạn cứng 5 học sinh (`slice(0,5)`) khi "xem tất cả" — hiển thị toàn bộ học sinh của lớp (có thể cuộn/ẩn-hiện).
- **C6** `ReportsPage`: thêm **biểu đồ tiến độ bài tập** — số bài nộp / số bài giao (homeworks) theo thời gian.
- **H1** `ReportsPage`: biểu đồ **clickable/drill-down** — click vào một cột (vd tháng) mở bảng chi tiết buổi/học sinh tương ứng tháng đó.

## Capabilities

### Modified Capabilities
- `pages`: `ReportsPage` chuyển sang bộ chọn lớp chung toàn trang, bỏ giới hạn 5 HS ở Mock Test, thêm biểu đồ tiến độ bài tập, và hỗ trợ drill-down từ biểu đồ sang bảng chi tiết.

## Impact

- **UI:** `src/pages/ReportsPage.jsx` + các card con (Attendance, MockTest, Fees, **Homework mới**), thêm modal/panel chi tiết drill-down.
- **Data:** tái dùng `attendanceService`, `mockTestService`/`mockTestResultService`, `feeService`/`paymentService`, **`homeworkService`/`hwAssignmentService`/`submissionService`** cho biểu đồ bài tập. Không gọi `supabase` trực tiếp.
- **Component:** tái dùng Chart.js (`react-chartjs-2`), `ExportButtons`, `Modal`. Dùng `onClick` handler của Chart.js cho drill-down.
- **Không ảnh hưởng:** data model, DB.
