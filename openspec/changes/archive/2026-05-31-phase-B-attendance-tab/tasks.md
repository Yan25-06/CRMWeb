# Tasks: Phase B — Tab Điểm Danh

## 0. Data Layer
- [x] 0.1 Thêm model Session vào db.js:
        `{ id, classId, date, startTime, endTime, scheduleItemId?, createdManually, topic?, note?, createdAt }`
- [x] 0.2 `getSessions(classId)` → Session[] sort theo date DESC
- [x] 0.3 `getSessionById(id)` → Session
- [x] 0.4 `createSession(data)` → Session
        side-effect: tạo HomeworkRecord `{ progress: 50 }` cho mỗi active student
- [x] 0.5 `deleteSession(id)` → void
        side-effect: xóa AttendanceRecord + HomeworkRecord liên quan (cascade)
- [x] 0.6 Migrate AttendanceRecord: thêm field `sessionId?: string`
        (backward-compat: nếu không có sessionId thì dùng date)
- [x] 0.7 `getAttendanceBySession(sessionId)` → AttendanceRecord[]
- [x] 0.8 `upsertAttendanceBySession(sessionId, studentId, present)` → AttendanceRecord
- [x] 0.9 `getAttendanceRate(studentId, classId)` → number (0–100)
        = count(present=true) / count(sessions có date ≤ today) × 100
- [x] 0.10 Seed: tạo 3 sessions demo cho lớp demo, link attendance demo

## 1. Component: SessionSelector
- [x] 1.1 Tạo `src/components/SessionSelector.jsx`
- [x] 1.2 Props: `sessions, activeSessionId, onSelect, onAddNew`
- [x] 1.3 Dropdown hiển thị: "[DD/MM/YYYY] — [topic hoặc 'Buổi học']"
- [x] 1.4 Sort mới nhất lên đầu (default chọn session mới nhất)
- [x] 1.5 Nút "+ Buổi mới" bên phải dropdown → gọi onAddNew

## 2. Component: SessionModal
- [x] 2.1 Tạo `src/components/SessionModal.jsx`
- [x] 2.2 Fields:
        - Ngày (date input, default hôm nay)
        - Giờ bắt đầu (time input, default 08:00)
        - Giờ kết thúc (time input, default 09:30)
        - Chủ đề buổi học (text input, optional)
        - Ghi chú GV (textarea, optional)
- [x] 2.3 Validate: ngày required, giờ kết thúc > giờ bắt đầu
- [x] 2.4 Guard: nếu đã có session cùng ngày → warn toast
        "Đã có buổi ngày này. Bạn có muốn tạo thêm?"
        → confirm → vẫn cho tạo
- [x] 2.5 Submit → createSession() → toast "Đã tạo buổi [DD/MM]!" → đóng modal

## 3. Component: AttendanceToggle
- [x] 3.1 Tạo `src/components/AttendanceToggle.jsx`
- [x] 3.2 Props: `present (boolean | null), onChange, disabled`
- [x] 3.3 States:
        - null  → button outline navy "—" (chưa chấm)
        - true  → button emerald filled "✓ Có"
        - false → button red filled "✗ Vắng"
- [x] 3.4 Click → toggle null→true→false→null (cycle)
- [x] 3.5 Animation: scale(0.9) → scale(1) khi toggle
- [x] 3.6 disabled khi student status=dropped (hiện "—" không click được)

## 4. Component: AttendanceRingChart
- [x] 4.1 Tạo `src/components/AttendanceRingChart.jsx`
- [x] 4.2 Props: `present, total, size (default 48)`
- [x] 4.3 SVG donut: navy-600 (có mặt) + navy-100 (vắng)
- [x] 4.4 Text % ở giữa (font-bold, navy-800)
- [x] 4.5 Tooltip: "X/Y buổi có mặt"

## 5. Component: StudentAttendancePanel
- [x] 5.1 Tạo `src/components/StudentAttendancePanel.jsx`
- [x] 5.2 Dạng drawer từ phải (slide-in, không che hết màn hình)
- [x] 5.3 Header: tên HS + nút đóng (X)
- [x] 5.4 AttendanceRingChart lớn (80px) + text "X/Y buổi (Z%)"
- [x] 5.5 Bảng lịch sử: [Buổi · Ngày · Chủ đề · Trạng thái]
        - sort mới nhất lên đầu
        - badge "Có mặt" (emerald) / "Vắng" (red) / "Chưa chấm" (gray)
- [x] 5.6 Mobile: full-screen modal thay drawer

## 6. Tab Điểm Danh (AttendanceTab)
- [x] 6.1 Tạo `src/pages/tabs/AttendanceTab.jsx`
- [x] 6.2 Props: `classId`
- [x] 6.3 Toolbar: SessionSelector + hiển thị "X/Y có mặt" real-time
- [x] 6.4 Empty state khi chưa có session: "Chưa có buổi học nào. Tạo buổi đầu tiên?"
- [x] 6.5 Bảng học viên active:
        - Col 1: avatar + tên (clickable → StudentAttendancePanel)
        - Col 2: AttendanceToggle (auto-save khi toggle)
        - Col 3: ghi chú vắng (input text, chỉ hiện khi vắng)
- [x] 6.6 HS paused: hiện trong bảng nhưng opacity-50, toggle disabled
- [x] 6.7 HS dropped: ẩn khỏi bảng (không hiển thị)
- [x] 6.8 Auto-save: mỗi toggle → upsertAttendanceBySession() ngay lập tức
- [x] 6.9 Prefill: khi chọn session đã có data → load đúng trạng thái từ db
- [x] 6.10 Nút "Xóa buổi này" (icon trash, góc phải toolbar) → confirm → deleteSession()

## 7. Update Phase A sau khi xong Phase B
- [x] 7.1 StudentDetailPanel (Phase A): card "Điểm danh" điền data thật
        từ `getAttendanceRate(studentId, classId)`
- [x] 7.2 Timeline (Phase A): thêm events điểm danh 5 buổi gần nhất
