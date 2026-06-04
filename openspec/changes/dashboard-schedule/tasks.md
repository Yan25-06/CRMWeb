## 1. Card "Lịch hôm nay"

- [x] 1.1 Tính danh sách buổi học hôm nay từ `scheduleService` (tái dùng logic agenda của `SchedulePage`) (B1)
- [x] 1.2 Render card "Lịch hôm nay" trên `DashboardPage` (tái dùng `DailyAgenda` hoặc card gọn) — tên lớp, giờ, số HS active
- [x] 1.3 Empty state khi hôm nay không có buổi

## 2. Điều hướng tới điểm danh

- [x] 2.1 Nối callback điều hướng từ mỗi buổi → đặt `selectedClassId` + mở `ClassDetailPage` tab Attendance qua `App.jsx` (G2)
- [x] 2.2 Xác minh dùng cùng cơ chế `onAttendance` mà `SchedulePage` đang dùng

## 3. Stat card "HS chưa đóng phí tháng này"

- [x] 3.1 Đếm HS còn nợ học phí tháng hiện tại bằng công thức `calcFee` − đã đóng (tái dùng logic `FeesPage`) (B2)
- [x] 3.2 Thay stat "Năm học" bằng card mới hiển thị số HS nợ
- [x] 3.3 Bấm card → `onNavigate('fees')`

## 4. Kiểm thử

- [x] 4.1 Test card lịch hôm nay với ngày có/không có buổi; điều hướng điểm danh đúng lớp + đúng tab
- [x] 4.2 Test số HS chưa đóng phí khớp với `FeesPage`; điều hướng sang Fees
- [x] 4.3 Cập nhật `CLAUDE.md`/`README.md` nếu mô tả Dashboard thay đổi
