## 1. Data Layer

- [ ] 1.1 Thêm `updateScheduleItem(id, data)` vào `src/store/db.js` — pattern giống `updateClass`
- [ ] 1.2 Thêm helper `getScheduleByDay(dayOfWeek)` để filter schedule items theo ngày

## 2. Utility — Conflict Checker

- [ ] 2.1 Tạo `src/utils/scheduleConflict.js` — hàm `checkConflicts(newItem, allItems)` trả về mảng conflict objects
- [ ] 2.2 Logic time overlap: `startA < endB && startB < endA`, chỉ check khi cùng `dayOfWeek` + cùng `room` (non-empty)

## 3. Components — Schedule Cards & Grid

- [ ] 3.1 Tạo `src/components/schedule/ScheduleCard.jsx` — thẻ ca học với color-coded theo courseType, hiển thị giờ/tên lớp/phòng/số HS
- [ ] 3.2 Tạo `src/components/schedule/WeeklyGrid.jsx` — lưới CSS Grid 7 cột, render ScheduleCards theo dayOfWeek, responsive mobile
- [ ] 3.3 Tạo color mapping `COURSE_COLORS` (IELTS navy, TOEIC teal, Giao Tiếp amber, default gray)

## 4. Components — Schedule Modal

- [ ] 4.1 Tạo `src/components/schedule/ScheduleModal.jsx` — form thêm/sửa ScheduleItem (classId, dayOfWeek, startTime, endTime, room, note)
- [ ] 4.2 Validation: classId & dayOfWeek & startTime & endTime bắt buộc, startTime < endTime
- [ ] 4.3 Tích hợp ConflictAlert — hiển thị cảnh báo xung đột trong modal, cho phép override hoặc cancel
- [ ] 4.4 Hỗ trợ mode sửa: prefill data từ existing item, gọi `updateScheduleItem` khi submit
- [ ] 4.5 Nút xóa trong modal sửa với confirm dialog

## 5. Components — Daily Agenda

- [ ] 5.1 Tạo `src/components/schedule/DailyAgenda.jsx` — sidebar hiển thị ca dạy hôm nay
- [ ] 5.2 Sắp xếp theo startTime ASC, hiển thị class name/time/room/student count
- [ ] 5.3 Nút "Điểm danh" trên mỗi ca → navigate đến tab Điểm Danh với classId

## 6. Page Assembly — SchedulePage

- [ ] 6.1 Tạo `src/pages/SchedulePage.jsx` — compose ScheduleHeader + WeeklyGrid + DailyAgenda
- [ ] 6.2 ScheduleHeader: hiển thị tháng/năm, nút ◄/► chuyển tuần, nút "Hôm nay", nút "+ Xếp Lịch"
- [ ] 6.3 State management: selectedWeek, modalOpen, editingItem
- [ ] 6.4 Layout responsive: desktop = grid + sidebar, mobile = agenda + stacked daily list

## 7. Integration

- [ ] 7.1 Cập nhật `App.jsx` — import `SchedulePage` thay vì placeholder, pass props
- [ ] 7.2 Cập nhật `PlaceholderPages.jsx` — loại bỏ export `SchedulePage` nếu không dùng nữa
- [ ] 7.3 Seed demo schedule data trong `seedDemoData()` — thêm 3-4 schedule items cho 2 lớp demo

## 8. Verification

- [ ] 8.1 Test hiển thị lưới tuần với demo data
- [ ] 8.2 Test thêm/sửa/xóa schedule item qua modal
- [ ] 8.3 Test conflict detection (trùng phòng + trùng giờ)
- [ ] 8.4 Test responsive mobile layout
- [ ] 8.5 Test điều hướng tuần (◄/►/Hôm nay)
