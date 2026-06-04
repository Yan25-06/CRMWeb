## Context

`ReportsPage` hiện có 3 card (Điểm danh, Mock Test, Học phí), mỗi card tự giữ state filter (lớp/học viên/khoảng tháng) và nút `ExportButtons` (Excel + PDF). Card Mock Test `slice(0,5)` học sinh. Biểu đồ vẽ bằng `react-chartjs-2` (Chart.js) — hỗ trợ `options.onClick` để bắt phần tử được click. Dữ liệu bài tập đã có service: `homeworkService`, `hwAssignmentService`, `submissionService`.

## Goals / Non-Goals

**Goals:**
- Một bộ chọn lớp chung điều khiển mọi biểu đồ.
- Bỏ giới hạn 5 HS ở Mock Test.
- Thêm biểu đồ tiến độ nộp bài tập theo thời gian.
- Click biểu đồ → bảng chi tiết tương ứng.

**Non-Goals:**
- Không đổi data model hay thêm bảng mới.
- Không gộp filter khoảng tháng vào global nếu từng card cần riêng — chỉ lớp là chung.

## Decisions

### 1. State lớp nâng lên page level
`ReportsPage` giữ `selectedClassId` chung, render bộ chọn lớp ở đầu trang; truyền xuống mọi card qua prop. Card không còn selector lớp riêng. Filter khoảng tháng (và chọn học viên ở Mock Test) vẫn có thể ở card vì mang tính cục bộ. Mặc định chọn lớp đầu hoặc "Tất cả lớp" nếu card hỗ trợ.

### 2. Bỏ slice(0,5) ở Mock Test
Hiển thị toàn bộ học sinh của lớp. Để tránh rối biểu đồ đường khi quá đông, cho phép ẩn/hiện series qua legend (Chart.js có sẵn) hoặc giới hạn series hiển thị mặc định nhưng KHÔNG cắt cứng dữ liệu — toàn bộ có thể bật lên. Quyết định: render tất cả, dùng legend toggle, bỏ hằng số 5.

### 3. Biểu đồ tiến độ bài tập (mới)
Card mới: trục thời gian (theo tuần/tháng), 2 series — số bài giao (`hwAssignmentService`) và số bài nộp (`submissionService`) trong kỳ, hoặc tỉ lệ nộp/giao. Lọc theo lớp chung. Có `ExportButtons`. Empty state khi lớp chưa có bài tập.

### 4. Drill-down qua onClick của Chart.js
Cấu hình `options.onClick` (dùng `getElementsAtEventForMode`) để xác định cột/điểm được click → mở `Modal` bảng chi tiết: vd click cột điểm danh tháng X → bảng buổi học + trạng thái từng học sinh tháng đó; click cột học phí tháng X → danh sách học sinh + đã đóng/nợ. Mỗi card định nghĩa nội dung drill-down phù hợp.

## Risks / Trade-offs

- **Refactor lift state có thể chạm nhiều chỗ trong ReportsPage** → đây là lý do tách change riêng; làm từng card một, giữ `ExportButtons` nguyên.
- **Biểu đồ Mock Test đông series khó đọc** → dựa vào legend toggle thay vì cắt cứng; cân nhắc mặc định bật N series đầu nhưng vẫn cho bật hết.
- **Drill-down dữ liệu nặng** → chỉ truy vấn/tính chi tiết khi mở modal (lazy), không tính sẵn cho mọi cột.

## Migration Plan

1. Lift `selectedClassId` lên `ReportsPage`, thêm bộ chọn lớp chung; bỏ selector lớp ở từng card.
2. Bỏ `slice(0,5)` ở Mock Test, dùng legend toggle.
3. Thêm card biểu đồ tiến độ bài tập (services homework) + `ExportButtons`.
4. Thêm `onClick` drill-down + `Modal` chi tiết cho các card.
5. Rollback: revert `ReportsPage` + card con; không có thay đổi DB.
