## Why

Tab "Lịch Dạy" hiện tại vẫn là placeholder. Giáo viên cần một giao diện quản lý thời khóa biểu trực quan dạng lưới tuần để sắp xếp phòng học, tránh xung đột lịch dạy, và nhanh chóng nắm bắt ca dạy trong ngày. Xây dựng tính năng này giúp hoàn thiện luồng vận hành cốt lõi: Lịch dạy → Điểm danh → Nhận xét.

## What Changes

- Thay thế `SchedulePage` placeholder bằng giao diện **Weekly Grid View** hiển thị lịch dạy cố định theo tuần (Thứ 2 → CN).
- Mỗi thẻ ca học trên lưới hiển thị: giờ học, tên lớp, phòng học, số lượng học viên hiện tại.
- **Color-coded theo `courseType`**: IELTS → navy, TOEIC → teal, Giao Tiếp → amber.
- Modal **"Xếp Lịch"** để thêm/sửa/xóa schedule item (chọn lớp, ngày trong tuần, giờ bắt đầu/kết thúc, phòng).
- **Conflict Checker**: tự động phát hiện xung đột giờ dạy giữa các lớp hoặc trùng phòng và cảnh báo đỏ.
- **Daily Agenda sidebar**: danh sách ca dạy trong ngày hôm nay kèm phím tắt nhanh đến Điểm danh / Giao bài tập.
- Hỗ trợ điều hướng tuần (nút ◄ / ►) và hiển thị tháng/năm.

## Capabilities

### New Capabilities
- `schedule-weekly-view`: Giao diện lưới 7 ngày hiển thị ca dạy cố định, color-coded theo courseType, điều hướng tuần.
- `schedule-conflict-checker`: Logic kiểm tra xung đột giờ dạy (trùng giáo viên hoặc trùng phòng) và cảnh báo.
- `schedule-management`: Modal thêm/sửa/xóa ScheduleItem với form validation.
- `daily-agenda`: Sidebar hiển thị danh sách ca dạy hôm nay, phím tắt điểm danh nhanh.

### Modified Capabilities
- `pages`: SchedulePage thay thế placeholder bằng module Weekly Grid View đầy đủ.
- `data`: Bổ sung field `room` cho ScheduleItem model (đã có trong spec nhưng optional — giờ cần hiển thị rõ).

## Impact

- **Pages**: `PlaceholderPages.jsx` → export `SchedulePage` sẽ bị loại bỏ, thay bằng `SchedulePage.jsx` mới.
- **Components**: Thêm mới `components/schedule/` (WeeklyGrid, ScheduleCard, ScheduleModal, ConflictAlert, DailyAgenda).
- **Data layer**: Sử dụng `phf_schedule` (đã có API trong `db.js`: `getSchedule`, `addScheduleItem`, `deleteScheduleItem`). Cần bổ sung `updateScheduleItem`.
- **Dependencies**: Không thêm thư viện mới. Dùng `lucide-react` cho icon, `clsx` cho conditional styles.
- **App.jsx**: Cập nhật route import cho SchedulePage.
