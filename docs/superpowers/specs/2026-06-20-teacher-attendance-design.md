# Design: Chấm Công Giáo Viên

**Ngày:** 2026-06-20  
**Tính năng:** Chấm công giáo viên trong trang Lịch Dạy  
**Người thực hiện:** Admin

---

## Tổng quan

Admin chấm công giáo viên trực tiếp trong trang Lịch Dạy — tương tự điểm danh học sinh nhưng dành cho giáo viên. Mỗi ca lịch cố định trên mỗi ngày cụ thể có thể được gắn trạng thái (Đã dạy / Vắng / Dạy bù) và ghi chú tự do. Chỉ admin thấy và thao tác tính năng này.

---

## Database

### Bảng mới: `teacher_attendance`

```sql
create table teacher_attendance (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references schedule(id) on delete cascade,
  date         date not null,
  teacher_id   uuid not null references teachers(id),
  status       text not null check (status in ('present', 'absent', 'makeup')),
  note         text,
  created_at   timestamptz default now(),
  unique (schedule_id, date)
);
```

**RLS:**
- Admin: INSERT, UPDATE, DELETE (policy `is_admin()`)
- Teacher: SELECT (xem chấm công của mình, filter `teacher_id = auth.uid()`)

**Cascade:** Khi xóa một schedule item → các record chấm công của slot đó tự xóa.

---

## Service Layer

**File:** `src/services/teacherAttendanceService.js`

Pattern chuẩn `fromDB / toDB`:

```js
fromDB: { id, scheduleId, date, teacherId, status, note, createdAt }
toDB:   { schedule_id, date, teacher_id, status, note }
```

**Methods:**
| Method | Mô tả |
|---|---|
| `getByWeek(dateFrom, dateTo)` | Load tất cả records trong khoảng ngày (dùng cho 1 tuần) |
| `upsert(scheduleId, date, { teacherId, status, note })` | Tạo hoặc cập nhật record (dùng Supabase upsert on conflict) |
| `remove(scheduleId, date)` | Xóa record chấm công (trả về "chưa chấm") |

---

## UI

### Luồng dữ liệu — `SchedulePage`

- Load thêm `teacherAttendance` khi `isAdmin` (gọi `getByWeek` với tuần hiện tại)
- Khi `weekStart` thay đổi → reload attendance cho tuần mới
- Build lookup: `Map<"scheduleId_YYYY-MM-DD", record>` để tra cứu O(1)
- Truyền `attendanceMap` + `onCheckIn` callback xuống WeeklyGrid và DailyAgenda

### WeeklyGrid / ScheduleCard

- Nhận thêm props: `date` (ngày của cột), `attendanceRecord` (record hoặc null), `onCheckIn(item, date)` (admin only)
- WeeklyGrid tính `date` cho mỗi cột từ `weekStart + offset theo dayOfWeek`
- Mỗi card hiển thị:
  - Chưa chấm: không có gì (admin thấy nút `[✓]` khi hover)
  - Đã chấm: dot màu ở góc phải + text status nhỏ bên dưới card
    - `present` → xanh (✅ Đã dạy)
    - `absent` → đỏ (❌ Vắng)
    - `makeup` → vàng (🔄 Dạy bù)
- Nút `[✓]` tách biệt với `✏️` sửa lịch để tránh nhầm

### DailyAgenda

- Nhận thêm props: `attendanceMap`, `onCheckIn(item, date)` (admin only)
- Mỗi ca hôm nay (admin only) hiển thị:
  - Chưa chấm: nút `[Chấm công]` bên cạnh nút `[Điểm danh]`
  - Đã chấm: badge màu theo status (click để sửa) + note nếu có

### Modal: `TeacherAttendanceModal`

**File:** `src/components/schedule/TeacherAttendanceModal.jsx`

Props: `open`, `onClose`, `item` (schedule item), `date`, `cls` (class info), `record` (existing hoặc null), `onSave(status, note)`, `onDelete`

Nội dung:
- Tiêu đề: "Chấm Công — [Tên lớp]" + subtext ngày
- Radio 3 trạng thái: ✅ Đã dạy / ❌ Vắng / 🔄 Dạy bù
- Textarea ghi chú (optional, placeholder "Ghi chú...")
- Footer: `[Xóa chấm công]` (chỉ khi đã có record) + `[Hủy]` `[Lưu]`

---

## Phân quyền

- Toàn bộ tính năng chấm công guard bằng `isAdmin` từ `usePermissions()`
- WeeklyGrid và DailyAgenda không render nút chấm công khi `!isAdmin`
- RLS ở Supabase là lớp bảo mật thật

---

## Scope KHÔNG bao gồm

- Báo cáo tổng hợp chấm công theo tháng (không yêu cầu)
- Teacher tự chấm công (chỉ admin)
- Tính lương từ dữ liệu chấm công
- Thông báo khi vắng

---

## Migration

**File:** `supabase/migrations/YYYYMMDD000001_teacher_attendance.sql`

Tạo bảng + unique constraint + RLS policies.

Cập nhật `supabase/seed/seed_mock_data.sql` thêm vài record chấm công mẫu khớp với mock schedule.
