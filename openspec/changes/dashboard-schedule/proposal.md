## Why

Dashboard hiện thiếu cái nhìn "ngày làm việc": không có card buổi học hôm nay, và stat card "Năm học" không mang thông tin hành động. Giáo viên phải chuyển sang Schedule/Attendance để biết hôm nay dạy lớp nào. Bổ sung card "Lịch hôm nay" có liên kết thẳng tới điểm danh và thay stat card vô nghĩa bằng số liệu hữu ích giúp Dashboard trở thành điểm khởi đầu thực sự cho ngày làm việc.

> Ghi chú: G1 (conflict detection khi tạo lịch) đã có sẵn — `ScheduleModal` dùng `checkConflicts` từ `src/utils/scheduleConflict.js`. Đã xác minh trong code, nên không nằm trong scope change này.

## What Changes

- **B1** `DashboardPage`: thêm card "Lịch hôm nay" liệt kê các buổi học trong ngày (tên lớp, giờ, số học sinh active). Empty state khi hôm nay không có buổi.
- **G2** `DashboardPage`: mỗi buổi trong card "Lịch hôm nay" có nút/link điều hướng thẳng tới trang điểm danh của lớp đó (mở `ClassDetailPage` tab Attendance), không chỉ hiển thị thông tin.
- **B2** `DashboardPage`: thay stat card "Năm học" bằng card hữu ích — **"HS chưa đóng phí tháng này"** (số học sinh còn nợ học phí tháng hiện tại), click điều hướng tới `FeesPage`.

## Capabilities

### Modified Capabilities
- `pages`: `DashboardPage` bổ sung card "Lịch hôm nay" có điều hướng tới điểm danh, và thay stat card "Năm học" bằng số HS chưa đóng phí.

## Impact

- **UI:** `src/pages/DashboardPage.jsx` (+ component con cho card lịch hôm nay nếu cần).
- **Data:** dùng `scheduleService` (lịch), `classService`/`enrollmentService` (đếm HS active), `feeService`/`paymentService` (đếm HS chưa đóng tháng hiện tại) — tái dùng logic tính học phí đã có. Không gọi `supabase` trực tiếp.
- **Điều hướng:** dùng cơ chế `selectedClassId` + `page` trong `App.jsx` để mở `ClassDetailPage` tab Attendance.
- **Không ảnh hưởng:** data model, DB, các trang khác.
