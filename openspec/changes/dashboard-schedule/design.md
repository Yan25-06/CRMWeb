## Context

`DashboardPage` nhận `onNavigate` từ `App.jsx`, hiện có 4 stat card (HS, Lớp, Doanh thu tháng, **Năm học**) + danh sách top HS + danh sách lớp + quick actions. `SchedulePage` đã có `DailyAgenda` hiển thị buổi học hôm nay và điều hướng tới điểm danh qua callback `onAttendance(classId)` (đặt `selectedClassId` + mở `ClassDetailPage` tab Attendance). Việc tính học phí/đếm nợ đã có sẵn ở `FeesPage` (qua `feeService`/`paymentService` + `calcFee`).

## Goals / Non-Goals

**Goals:**
- Card "Lịch hôm nay" trên Dashboard, mỗi buổi điều hướng được tới điểm danh.
- Thay stat "Năm học" bằng "HS chưa đóng phí tháng này", click sang `FeesPage`.

**Non-Goals:**
- Không xây lại `DailyAgenda` — tái dùng logic/cách điều hướng tương tự `SchedulePage`.
- Không đụng conflict detection (G1 đã có sẵn).
- Không đổi data model hay service.

## Decisions

### 1. Tái dùng cơ chế điều hướng điểm danh của SchedulePage
Dashboard truyền callback điều hướng tới `App.jsx` để đặt `selectedClassId` + chuyển `page='classes'` mở tab Attendance — đúng cách `DailyAgenda` đang làm. Có thể tái dùng trực tiếp component `DailyAgenda` hoặc viết card gọn hơn cho Dashboard nhưng dùng cùng callback. Ưu tiên tái dùng `DailyAgenda` để giảm trùng lặp.

### 2. Tính "buổi học hôm nay"
Lấy lịch qua `scheduleService`, lọc theo thứ trong tuần / ngày hôm nay (cùng logic `SchedulePage` dùng cho agenda). Mỗi dòng: tên lớp + giờ + số HS active (đếm enrollment `active`). Empty state khi không có buổi.

### 3. Card "HS chưa đóng phí tháng này"
Đếm số học sinh còn nợ học phí của tháng hiện tại (tháng từ context Dashboard) bằng cùng công thức `FeesPage` dùng để tính debt (`calcFee` − đã đóng). Hiển thị số HS, click điều hướng `onNavigate('fees')`. Thay thế hẳn stat "Năm học".

## Risks / Trade-offs

- **Tính nợ lặp logic với FeesPage** → trích logic đếm nợ về util dùng chung nếu thấy lặp nhiều; nếu nhỏ thì gọi cùng service + công thức tại Dashboard. Không nhân bản truy vấn nặng.
- **DailyAgenda gốc thiết kế cho sidebar Schedule** → kiểm tra render gọn trong grid Dashboard; nếu lệch layout thì bọc trong Card riêng.

## Migration Plan

1. Tích hợp card "Lịch hôm nay" (tái dùng `DailyAgenda` hoặc card mới) vào `DashboardPage`, nối callback điều hướng điểm danh qua `App.jsx`.
2. Thay stat "Năm học" bằng "HS chưa đóng phí tháng này" + điều hướng `fees`.
3. Rollback: revert `DashboardPage`; không có thay đổi DB.
