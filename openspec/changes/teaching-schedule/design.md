## Context

Ứng dụng RollCall Manager hiện có 7 mục navbar. Tab "Lịch Dạy" vẫn là placeholder (`PlaceholderPages.jsx`). Data layer `phf_schedule` đã tồn tại với CRUD cơ bản (`getSchedule`, `addScheduleItem`, `deleteScheduleItem`), thiếu `updateScheduleItem`. Dữ liệu lớp học (`phf_classes`) đã có field `courseType`, `scheduleDays`, `scheduleTime` nhưng chỉ hiển thị trên ClassCard — chưa được dùng cho lịch dạy dạng lưới.

Hệ thống dùng React 18 + Vite, Tailwind CSS, localStorage, lucide-react icons.

## Goals / Non-Goals

**Goals:**
- Xây dựng Weekly Grid View 7 ngày (Thứ 2 → CN) hiển thị tất cả ca dạy cố định.
- Color-coded theo courseType (IELTS navy, TOEIC teal, Giao Tiếp amber).
- Modal thêm/sửa/xóa ScheduleItem với form validation đầy đủ.
- Conflict Checker phát hiện trùng giờ + trùng phòng, hiển thị cảnh báo trực quan.
- Daily Agenda sidebar hiển thị ca dạy hôm nay, phím tắt điểm danh nhanh.
- Điều hướng tuần (◄ / ►) với hiển thị tháng/năm.

**Non-Goals:**
- Không hỗ trợ kéo-thả (drag-and-drop) ca học trên lưới — quá phức tạp cho phase này.
- Không tích hợp lịch Google/Outlook.
- Không tạo sessions tự động từ schedule — tính năng đó thuộc module Điểm danh.

## Decisions

### 1. Component Architecture

```
SchedulePage.jsx
├── ScheduleHeader (tháng/năm, nút ◄/►, nút "+ Xếp Lịch")
├── WeeklyGrid (lưới 7 cột × time slots)
│   └── ScheduleCard (thẻ ca học trên lưới)
├── DailyAgenda (sidebar danh sách ca hôm nay)
├── ScheduleModal (form thêm/sửa schedule item)
└── ConflictAlert (banner cảnh báo xung đột)
```

**Rationale**: Tách component theo vai trò UI giúp dễ test, reuse, và maintain. ScheduleCard dùng lại design system Card nhưng compact hơn.

### 2. Weekly Grid Layout — CSS Grid 7 cột

Dùng CSS Grid `grid-template-columns: repeat(7, 1fr)` để chia 7 ngày. Mỗi cột chứa các ScheduleCard xếp theo `startTime` ASC. Trên mobile (< 768px), chuyển sang dạng danh sách dọc (stacked daily view) thay vì lưới — vì 7 cột trên mobile quá nhỏ.

**Alternatives considered**: 
- Table HTML: Cứng, khó responsive.
- Thư viện lịch bên thứ 3 (react-big-calendar): Quá nặng, không cần nhiều feature.

### 3. Conflict Detection — Client-side real-time

Kiểm tra xung đột khi user submit modal ScheduleItem:
- **Trùng phòng**: Cùng `dayOfWeek` + cùng `room` (non-empty) + time overlap.
- **Time overlap**: `startA < endB && startB < endA`.

Không cần kiểm tra trùng giáo viên vì app single-teacher. Conflict warning hiển thị dạng banner đỏ trên modal, cho phép user xác nhận override hoặc cancel.

### 4. Color Mapping

```javascript
const COURSE_COLORS = {
  'IELTS':     { bg: 'bg-navy-100', border: 'border-navy-300', text: 'text-navy-800' },
  'TOEIC':     { bg: 'bg-teal-50',  border: 'border-teal-200', text: 'text-teal-700' },
  'Giao Tiếp': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  'default':   { bg: 'bg-gray-50',  border: 'border-gray-200', text: 'text-gray-600' },
}
```

**Rationale**: Dùng bg nhạt + border + text đậm tạo thẻ dễ đọc, nhất quán với design system navy/white.

### 5. Data Layer — Bổ sung `updateScheduleItem`

Hiện `db.js` chỉ có `addScheduleItem` và `deleteScheduleItem`. Cần thêm:
```javascript
export const updateScheduleItem = (id, data) => {
  saveSchedule(getSchedule().map(s => s.id === id ? { ...s, ...data } : s))
}
```

Pattern giống `updateClass`, `updateStudent` đã có.

### 6. Mobile Layout

- Desktop (≥ 768px): Grid 7 cột + DailyAgenda sidebar bên phải.
- Mobile (< 768px): DailyAgenda trên cùng (collapsed, expandable) + danh sách ca theo từng ngày xếp dọc. Không hiển thị grid trên mobile.

## Risks / Trade-offs

- **[Performance]** Nếu số lượng schedule items lớn (> 50), lưới có thể render chậm. → **Mitigation**: Hiện tại app quy mô nhỏ (< 10 lớp), không cần virtualization.
- **[Data consistency]** Schedule items không liên kết chặt với sessions — thay đổi schedule không tự động cập nhật sessions đã tạo. → **Mitigation**: Thiết kế tách biệt, user tự sync qua module Điểm Danh.
- **[Color mapping]** Nếu courseType mới được thêm mà không có trong COURSE_COLORS → fallback `default` color. Không crash.
