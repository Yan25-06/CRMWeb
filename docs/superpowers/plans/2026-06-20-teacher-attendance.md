# Chấm Công Giáo Viên — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép admin chấm công giáo viên (Đã dạy / Vắng / Dạy bù + ghi chú) trực tiếp trên trang Lịch Dạy, theo từng ca lịch cố định trên từng ngày cụ thể.

**Architecture:** Bảng mới `teacher_attendance` lưu record theo `(schedule_id, date)`. Service layer `teacherAttendanceService` theo pattern `fromDB/toDB` chuẩn của dự án. `SchedulePage` load attendance của tuần đang xem (chỉ khi admin), build lookup map, truyền xuống `WeeklyGrid`/`DailyAgenda`; chấm công qua `TeacherAttendanceModal`. Toàn bộ tính năng guard bằng `usePermissions().canCheckTeacherAttendance`. RLS Postgres: admin full write, teacher read-only.

**Tech Stack:** React 18 + Vite, Tailwind (navy tokens), Supabase JS, lucide-react, clsx. **Không có test runner** trong dự án → verification thực hiện thủ công qua `npm run dev` + Supabase SQL Editor.

---

## Bối cảnh dự án (đọc trước khi bắt đầu)

- **Service pattern:** Xem `src/services/scheduleService.js` — mỗi service là object với `fromDB(row)` (snake→camel), `toDB(data)` (camel→snake), mọi method `throw new Error(error.message)` khi lỗi.
- **UI không gọi `supabase.*` trực tiếp** — luôn qua service.
- **Phân quyền UI:** dùng `usePermissions()` (`src/hooks/usePermissions.js`), KHÔNG đọc `teacher.is_admin` trực tiếp trong component.
- **Design system:** dùng component từ `@/components/ui` (`Modal`, `Button`, `toast`...). KHÔNG hard-code màu hex; dùng navy tokens. `clsx()` cho conditional class.
- **Migration:** đặt trong `supabase/migrations/`, đặt tên theo timestamp tăng dần. Grant quyền đã tự động cho bảng mới (xem `20260602000002_grant_schema_permissions.sql` dùng `alter default privileges`), nên **không cần** thêm GRANT.
- **Helper `is_admin()`** đã tồn tại (SECURITY DEFINER) — dùng trong RLS policy.
- Ngày: lưu dạng `YYYY-MM-DD`. Hôm nay = 2026-06-20.

---

## File Structure

| File | Trách nhiệm | Loại |
|---|---|---|
| `supabase/migrations/20260620000001_create_teacher_attendance.sql` | Tạo bảng + RLS | Create |
| `src/services/teacherAttendanceService.js` | CRUD chấm công | Create |
| `src/components/schedule/TeacherAttendanceModal.jsx` | Modal chọn trạng thái + ghi chú | Create |
| `src/components/schedule/attendanceStatus.js` | Hằng số trạng thái + màu/nhãn (DRY giữa các component) | Create |
| `src/hooks/usePermissions.js` | Thêm cờ `canCheckTeacherAttendance` | Modify |
| `src/pages/SchedulePage.jsx` | Load attendance theo tuần, build map, wiring modal | Modify |
| `src/components/schedule/WeeklyGrid.jsx` | Tính `date` mỗi cột, truyền record + callback xuống card | Modify |
| `src/components/schedule/ScheduleCard.jsx` | Hiển thị badge trạng thái + nút chấm công | Modify |
| `src/components/schedule/DailyAgenda.jsx` | Nút/badge chấm công cho ca hôm nay | Modify |
| `supabase/seed/seed_mock_data.sql` | Thêm record chấm công mẫu | Modify |
| `CLAUDE.md` + `README.md` | Cập nhật tài liệu | Modify |

---

## Task 1: Migration — bảng `teacher_attendance` + RLS

**Files:**
- Create: `supabase/migrations/20260620000001_create_teacher_attendance.sql`

- [ ] **Step 1: Tạo file migration**

```sql
-- =========================================================================
-- Migration: Teacher attendance (chấm công giáo viên)
-- Change: add-teacher-attendance
--
-- Admin chấm công giáo viên theo từng ca lịch cố định (schedule) trên một
-- ngày cụ thể. Mỗi (schedule_id, date) chỉ có 1 record (unique).
--
-- RLS: admin full write (is_admin()); teacher chỉ SELECT record của mình.
-- Rollback = drop table (cascade tự dọn policy).
-- =========================================================================

create table public.teacher_attendance (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.schedule(id) on delete cascade,
  date         date not null,
  teacher_id   uuid not null references public.teachers(id),
  status       text not null check (status in ('present', 'absent', 'makeup')),
  note         text,
  created_at   timestamptz not null default now(),
  unique (schedule_id, date)
);

alter table public.teacher_attendance enable row level security;

-- Teacher: chỉ đọc record chấm công của chính mình.
create policy "teacher_attendance: teacher or admin select"
  on public.teacher_attendance for select
  using (teacher_id = auth.uid() or is_admin());

-- Admin: toàn quyền ghi.
create policy "teacher_attendance: admin insert"
  on public.teacher_attendance for insert with check (is_admin());
create policy "teacher_attendance: admin update"
  on public.teacher_attendance for update using (is_admin()) with check (is_admin());
create policy "teacher_attendance: admin delete"
  on public.teacher_attendance for delete using (is_admin());
```

- [ ] **Step 2: Chạy migration trên Supabase**

Mở Supabase Dashboard → SQL Editor → dán toàn bộ nội dung file → Run.
Expected: "Success. No rows returned".

- [ ] **Step 3: Verify bảng + RLS tồn tại**

Trong SQL Editor chạy:
```sql
select tablename, policyname from pg_policies where tablename = 'teacher_attendance';
```
Expected: 4 dòng (1 select + insert/update/delete admin).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260620000001_create_teacher_attendance.sql
git commit -m "feat(db): add teacher_attendance table and RLS"
```

---

## Task 2: Hằng số trạng thái chấm công

Tách hằng số ra file riêng để DUNG chung giữa Modal, ScheduleCard, DailyAgenda (DRY).

**Files:**
- Create: `src/components/schedule/attendanceStatus.js`

- [ ] **Step 1: Tạo file**

```js
// Trạng thái chấm công giáo viên — dùng chung giữa modal, card, agenda.
// Màu dùng Tailwind tokens (không hard-code hex).
export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Đã dạy', icon: '✅', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200' },
  { value: 'absent',  label: 'Vắng',   icon: '❌', dot: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200'   },
  { value: 'makeup',  label: 'Dạy bù', icon: '🔄', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200' },
]

export const getAttendanceStatus = (value) =>
  ATTENDANCE_STATUSES.find(s => s.value === value) ?? null
```

- [ ] **Step 2: Commit**

```bash
git add src/components/schedule/attendanceStatus.js
git commit -m "feat(schedule): add teacher attendance status constants"
```

---

## Task 3: Service layer `teacherAttendanceService`

**Files:**
- Create: `src/services/teacherAttendanceService.js`

- [ ] **Step 1: Tạo service theo pattern fromDB/toDB**

```js
import { supabase } from '@/lib/supabase'

const fromDB = (row) => row ? {
  id: row.id,
  scheduleId: row.schedule_id,
  date: row.date,
  teacherId: row.teacher_id,
  status: row.status,
  note: row.note,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  schedule_id: data.scheduleId,
  date: data.date,
  teacher_id: data.teacherId,
  status: data.status,
  note: data.note ?? null,
})

export const teacherAttendanceService = {
  // Lấy mọi record trong khoảng ngày (dùng cho 1 tuần). dateFrom/dateTo: 'YYYY-MM-DD'
  async getByWeek(dateFrom, dateTo) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select('*')
      .gte('date', dateFrom)
      .lte('date', dateTo)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  // Tạo hoặc cập nhật record theo (schedule_id, date).
  async upsert({ scheduleId, date, teacherId, status, note }) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert(toDB({ scheduleId, date, teacherId, status, note }), {
        onConflict: 'schedule_id,date',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },

  async remove(scheduleId, date) {
    const { error } = await supabase
      .from('teacher_attendance')
      .delete()
      .eq('schedule_id', scheduleId)
      .eq('date', date)
    if (error) throw new Error(error.message)
  },
}
```

- [ ] **Step 2: Verify import không lỗi cú pháp**

Run: `npm run build`
Expected: build thành công, không lỗi liên quan file mới.

- [ ] **Step 3: Commit**

```bash
git add src/services/teacherAttendanceService.js
git commit -m "feat(service): add teacherAttendanceService"
```

---

## Task 4: Thêm cờ phân quyền

**Files:**
- Modify: `src/hooks/usePermissions.js`

- [ ] **Step 1: Thêm cờ `canCheckTeacherAttendance`**

Trong object return của `usePermissions()`, thêm dòng sau `canFilterByTeacher: isAdmin,`:

```js
    canFilterByTeacher: isAdmin,
    canCheckTeacherAttendance: isAdmin,
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePermissions.js
git commit -m "feat(permissions): add canCheckTeacherAttendance flag"
```

---

## Task 5: Modal chấm công `TeacherAttendanceModal`

**Files:**
- Create: `src/components/schedule/TeacherAttendanceModal.jsx`

- [ ] **Step 1: Tạo component**

```jsx
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { Trash2 } from 'lucide-react'
import { Modal, Button } from '@/components/ui'
import { ATTENDANCE_STATUSES } from './attendanceStatus'

const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

const formatDateLabel = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
}

/**
 * TeacherAttendanceModal — admin chấm công 1 ca trên 1 ngày
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Object}   cls     - class info (name)
 * @param {string}   date    - 'YYYY-MM-DD'
 * @param {Object}   record  - record hiện có hoặc null
 * @param {Function} onSave  - callback({ status, note })
 * @param {Function} onDelete- callback() — xóa record (chỉ khi đã có record)
 */
export const TeacherAttendanceModal = ({ open, onClose, cls, date, record, onSave, onDelete }) => {
  const [status, setStatus] = useState('present')
  const [note, setNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      setStatus(record?.status ?? 'present')
      setNote(record?.note ?? '')
      setConfirmDelete(false)
    }
  }, [open, record])

  const handleSave = () => {
    onSave?.({ status, note: note.trim() })
    onClose?.()
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete?.()
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chấm Công — ${cls?.name ?? '—'}`}
      footer={
        <div className="flex items-center justify-between gap-2">
          {record && (
            <Button variant="danger" size="sm" onClick={handleDelete} className="flex items-center gap-1.5">
              <Trash2 size={14} />
              {confirmDelete ? 'Xác nhận xóa?' : 'Xóa chấm công'}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>Lưu</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-navy-500">{formatDateLabel(date)}</p>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-navy-700">Trạng thái</label>
          <div className="flex flex-col gap-2">
            {ATTENDANCE_STATUSES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors text-left',
                  status === s.value
                    ? clsx(s.bg, s.border, s.text)
                    : 'bg-white border-navy-100 text-navy-600 hover:bg-navy-50'
                )}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-navy-700">Ghi chú (tùy chọn)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="VD: Nghỉ bệnh, dạy thay cô A..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/schedule/TeacherAttendanceModal.jsx
git commit -m "feat(schedule): add TeacherAttendanceModal"
```

---

## Task 6: ScheduleCard — badge trạng thái + nút chấm công

**Files:**
- Modify: `src/components/schedule/ScheduleCard.jsx`

- [ ] **Step 1: Cập nhật imports**

Thay dòng import lucide:
```jsx
import { Clock, MapPin, Users, Edit2 } from 'lucide-react'
```
thành:
```jsx
import { Clock, MapPin, Users, Edit2, CheckSquare } from 'lucide-react'
import { getAttendanceStatus } from './attendanceStatus'
```

- [ ] **Step 2: Mở rộng signature + thân component**

Thay khối từ `export const ScheduleCard = ({ ... }) => {` đến hết phần header (dòng `</div>` đóng khối "Course type dot") bằng:

```jsx
export const ScheduleCard = ({ item, cls, studentCount, showTeacher, onEdit, canCheckAttendance = false, attendanceRecord = null, onCheckIn }) => {
  const color = getCourseColor(cls?.courseType)
  const att = getAttendanceStatus(attendanceRecord?.status)

  return (
    <div
      className={clsx(
        'group relative rounded-xl border p-2.5 cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5',
        color.bg, color.border
      )}
      onClick={() => onEdit?.(item)}
    >
      {/* Course type dot */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={clsx('w-2 h-2 rounded-full shrink-0', color.dot)} />
        <span className={clsx('text-xs font-semibold truncate', color.text)}>
          {cls?.name ?? '—'}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          {canCheckAttendance && (
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/60"
              title="Chấm công giáo viên"
              onClick={(e) => { e.stopPropagation(); onCheckIn?.(item) }}
            >
              <CheckSquare size={11} className={color.text} />
            </button>
          )}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/60"
            onClick={(e) => { e.stopPropagation(); onEdit?.(item) }}
          >
            <Edit2 size={11} className={color.text} />
          </button>
        </div>
      </div>
```

- [ ] **Step 3: Thêm badge trạng thái trước thẻ đóng `</div>` cuối cùng**

Ngay trước dòng `</div>` cuối (đóng card), thêm:

```jsx
      {/* Teacher attendance badge */}
      {att && (
        <div className={clsx('flex items-center gap-1 text-xs mt-1.5 pt-1.5 border-t font-medium', att.text, att.border)}>
          <span className={clsx('w-2 h-2 rounded-full shrink-0', att.dot)} />
          <span className="truncate">
            {att.label}{attendanceRecord?.note ? ` · ${attendanceRecord.note}` : ''}
          </span>
        </div>
      )}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/ScheduleCard.jsx
git commit -m "feat(schedule): show attendance badge and check-in button on card"
```

---

## Task 7: WeeklyGrid — tính date mỗi cột, truyền record xuống card

**Files:**
- Modify: `src/components/schedule/WeeklyGrid.jsx`

- [ ] **Step 1: Thêm helper format date ở đầu file (sau dòng `const DAY_ORDER`)**

```js
// Trả về 'YYYY-MM-DD' cho một dayOfWeek trong tuần bắt đầu từ weekStart (Date).
const dateForDay = (weekStart, dayOfWeek) => {
  if (!weekStart) return null
  const d = new Date(weekStart)
  // weekStart là Thứ Hai (DAY_ORDER bắt đầu từ 1). Tính offset từ Mon.
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

- [ ] **Step 2: Mở rộng signature**

Thay:
```jsx
export const WeeklyGrid = ({ scheduleItems = [], classes = [], studentCounts = new Map(), showTeacher = false, onEdit, onAddDay }) => {
```
thành:
```jsx
export const WeeklyGrid = ({ scheduleItems = [], classes = [], studentCounts = new Map(), showTeacher = false, onEdit, onAddDay, weekStart = null, canCheckAttendance = false, attendanceMap = new Map(), onCheckIn }) => {
```

- [ ] **Step 3: Truyền props xuống card desktop**

Trong nhánh desktop, thay khối `<ScheduleCard ... />` (trong `byDay[day].map`) bằng:

```jsx
                byDay[day].map(item => {
                  const date = dateForDay(weekStart, day)
                  return (
                    <ScheduleCard
                      key={item.id}
                      item={item}
                      cls={getClass(item.classId)}
                      studentCount={studentCounts.get(item.classId)}
                      showTeacher={showTeacher}
                      onEdit={onEdit}
                      canCheckAttendance={canCheckAttendance}
                      attendanceRecord={attendanceMap.get(`${item.id}_${date}`) ?? null}
                      onCheckIn={(it) => onCheckIn?.(it, date)}
                    />
                  )
                })
```

- [ ] **Step 4: Truyền props xuống card mobile**

Trong nhánh mobile (`md:hidden`), thay khối `byDay[day].map(item => (<ScheduleCard ... />))` bằng:

```jsx
                {byDay[day].map(item => {
                  const date = dateForDay(weekStart, day)
                  return (
                    <ScheduleCard
                      key={item.id}
                      item={item}
                      cls={getClass(item.classId)}
                      studentCount={studentCounts.get(item.classId)}
                      showTeacher={showTeacher}
                      onEdit={onEdit}
                      canCheckAttendance={canCheckAttendance}
                      attendanceRecord={attendanceMap.get(`${item.id}_${date}`) ?? null}
                      onCheckIn={(it) => onCheckIn?.(it, date)}
                    />
                  )
                })}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 6: Commit**

```bash
git add src/components/schedule/WeeklyGrid.jsx
git commit -m "feat(schedule): wire attendance records into weekly grid cards"
```

---

## Task 8: DailyAgenda — nút/badge chấm công cho ca hôm nay

**Files:**
- Modify: `src/components/schedule/DailyAgenda.jsx`

- [ ] **Step 1: Cập nhật imports (đầu file)**

Thay:
```jsx
import { Clock, MapPin, Users, CalendarCheck, ChevronDown } from 'lucide-react'
import { getCourseColor } from './ScheduleCard'
```
thành:
```jsx
import { Clock, MapPin, Users, CalendarCheck, ChevronDown, CheckSquare } from 'lucide-react'
import { getCourseColor } from './ScheduleCard'
import { getAttendanceStatus } from './attendanceStatus'
```

- [ ] **Step 2: Mở rộng signature + tính date hôm nay**

Thay:
```jsx
export const DailyAgenda = ({ todayItems = [], classes = [], studentCounts = new Map(), showTeacher = false, onAttendance }) => {
  const [collapsed, setCollapsed] = useState(false)
  const today = new Date()
  const todayLabel = `${DAY_NAMES[today.getDay()]}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
```
thành:
```jsx
export const DailyAgenda = ({ todayItems = [], classes = [], studentCounts = new Map(), showTeacher = false, onAttendance, canCheckAttendance = false, attendanceMap = new Map(), onCheckIn }) => {
  const [collapsed, setCollapsed] = useState(false)
  const today = new Date()
  const todayLabel = `${DAY_NAMES[today.getDay()]}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
```

- [ ] **Step 3: Thêm nút chấm công vào mỗi ca**

Trong `sorted.map(item => { ... })`, ngay sau khối nút "Quick attendance button" (thẻ `<button onClick={() => onAttendance?.(item.classId)} ...>...</button>`), bọc lại layout nút bên phải. Thay nguyên khối `{/* Quick attendance button */}` ... `</button>` bằng:

```jsx
                    {/* Action buttons */}
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      <button
                        onClick={() => onAttendance?.(item.classId)}
                        className="flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-900 bg-navy-50 hover:bg-navy-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        title="Đến trang điểm danh"
                      >
                        <CalendarCheck size={13} />
                        Điểm danh
                      </button>

                      {canCheckAttendance && (() => {
                        const record = attendanceMap.get(`${item.id}_${todayStr}`) ?? null
                        const att = getAttendanceStatus(record?.status)
                        return (
                          <button
                            onClick={() => onCheckIn?.(item, todayStr)}
                            className={clsx(
                              'flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors',
                              att
                                ? clsx(att.bg, att.text, 'hover:opacity-80')
                                : 'text-navy-600 bg-navy-50 hover:bg-navy-100'
                            )}
                            title="Chấm công giáo viên"
                          >
                            <CheckSquare size={13} />
                            {att ? att.label : 'Chấm công'}
                          </button>
                        )
                      })()}
                    </div>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/DailyAgenda.jsx
git commit -m "feat(schedule): add teacher check-in button to daily agenda"
```

---

## Task 9: SchedulePage — load attendance, build map, wiring modal

**Files:**
- Modify: `src/pages/SchedulePage.jsx`

- [ ] **Step 1: Thêm imports**

Sau dòng `import { ScheduleModal } from '@/components/schedule/ScheduleModal'` thêm:
```jsx
import { TeacherAttendanceModal } from '@/components/schedule/TeacherAttendanceModal'
import { teacherAttendanceService } from '@/services/teacherAttendanceService'
```

Thay dòng:
```jsx
const { canFilterByTeacher: isAdmin } = usePermissions()
```
thành:
```jsx
const { canFilterByTeacher: isAdmin, canCheckTeacherAttendance } = usePermissions()
```

- [ ] **Step 2: Thêm helper format date (sau hàm `formatWeekLabel`, trước `export const SchedulePage`)**

```js
const toDateStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
```

- [ ] **Step 3: Thêm state cho attendance + modal chấm công**

Sau dòng `const [error, setError] = useState(false)` thêm:
```jsx
  // Teacher attendance (admin chấm công)
  const [attendance, setAttendance] = useState([])
  const [attModalOpen, setAttModalOpen] = useState(false)
  const [attTarget, setAttTarget] = useState(null) // { item, date }
```

- [ ] **Step 4: Load attendance của tuần đang xem**

Sau `useEffect(() => { loadData() }, [loadData])` thêm effect mới:
```jsx
  // Load attendance cho tuần đang xem (chỉ admin)
  const loadAttendance = useCallback(async () => {
    if (!canCheckTeacherAttendance) { setAttendance([]); return }
    const from = toDateStr(weekStart)
    const end = new Date(weekStart); end.setDate(end.getDate() + 6)
    const to = toDateStr(end)
    try {
      const rows = await teacherAttendanceService.getByWeek(from, to)
      setAttendance(rows)
    } catch {
      setAttendance([])
    }
  }, [canCheckTeacherAttendance, weekStart])

  useEffect(() => { loadAttendance() }, [loadAttendance])
```

- [ ] **Step 5: Build attendance lookup map**

Sau `const studentCounts = useMemo(...)` thêm:
```jsx
  // Map<"scheduleId_YYYY-MM-DD", record> để tra cứu O(1)
  const attendanceMap = useMemo(() => {
    const map = new Map()
    for (const r of attendance) map.set(`${r.scheduleId}_${r.date}`, r)
    return map
  }, [attendance])
```

- [ ] **Step 6: Thêm handlers chấm công**

Sau `handleDelete` (handler xóa lịch) thêm:
```jsx
  const openCheckIn = useCallback((item, date) => {
    setAttTarget({ item, date })
    setAttModalOpen(true)
  }, [])

  const handleSaveAttendance = useCallback(async ({ status, note }) => {
    if (!attTarget) return
    const cls = classes.find(c => c.id === attTarget.item.classId)
    try {
      await teacherAttendanceService.upsert({
        scheduleId: attTarget.item.id,
        date: attTarget.date,
        teacherId: cls?.teacherId,
        status,
        note,
      })
      toast.success('Đã chấm công')
      await loadAttendance()
    } catch {
      toast.error('Không thể chấm công')
    }
  }, [attTarget, classes, loadAttendance])

  const handleDeleteAttendance = useCallback(async () => {
    if (!attTarget) return
    try {
      await teacherAttendanceService.remove(attTarget.item.id, attTarget.date)
      toast.success('Đã xóa chấm công')
      await loadAttendance()
    } catch {
      toast.error('Không thể xóa chấm công')
    }
  }, [attTarget, loadAttendance])
```

- [ ] **Step 7: Truyền props vào WeeklyGrid**

Thay khối `<WeeklyGrid ... />` bằng:
```jsx
              <WeeklyGrid
                scheduleItems={visibleSchedule}
                classes={visibleClasses}
                studentCounts={studentCounts}
                showTeacher={showTeacher}
                onEdit={openEdit}
                onAddDay={openAdd}
                weekStart={weekStart}
                canCheckAttendance={canCheckTeacherAttendance}
                attendanceMap={attendanceMap}
                onCheckIn={openCheckIn}
              />
```

- [ ] **Step 8: Truyền props vào cả 2 DailyAgenda (desktop + mobile)**

Với MỖI trong hai `<DailyAgenda ... />`, thêm 3 prop trước thẻ đóng `/>`:
```jsx
            canCheckAttendance={canCheckTeacherAttendance}
            attendanceMap={attendanceMap}
            onCheckIn={openCheckIn}
```
(DailyAgenda hôm nay chỉ dùng record của ngày hôm nay nên `attendanceMap` đầy đủ của tuần vẫn đúng — nó tự lọc theo `todayStr`.)

- [ ] **Step 9: Thêm TeacherAttendanceModal trước thẻ đóng `</div>` cuối của return**

Ngay sau `<ScheduleModal ... />`, thêm:
```jsx
      {/* ── Teacher attendance modal ───────────────────── */}
      <TeacherAttendanceModal
        open={attModalOpen}
        onClose={() => setAttModalOpen(false)}
        cls={attTarget ? classes.find(c => c.id === attTarget.item.classId) : null}
        date={attTarget?.date}
        record={attTarget ? attendanceMap.get(`${attTarget.item.id}_${attTarget.date}`) ?? null : null}
        onSave={handleSaveAttendance}
        onDelete={handleDeleteAttendance}
      />
```

- [ ] **Step 10: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 11: Commit**

```bash
git add src/pages/SchedulePage.jsx
git commit -m "feat(schedule): wire teacher attendance into SchedulePage"
```

---

## Task 10: Kiểm thử thủ công end-to-end

**Files:** (không sửa file — chỉ verify)

- [ ] **Step 1: Chạy dev server**

Run: `npm run dev`
Mở http://localhost:5173, đăng nhập bằng **tài khoản admin**.

- [ ] **Step 2: Verify trên WeeklyGrid (admin)**

- Vào trang Lịch Dạy. Hover một card ca dạy → thấy 2 icon: ô vuông tích (chấm công) + bút chì (sửa lịch).
- Click icon chấm công → modal "Chấm Công — [tên lớp]" mở, hiển thị đúng ngày của cột đó.
- Chọn "Đã dạy", lưu → toast "Đã chấm công", card hiện badge xanh "Đã dạy" ở dưới.
- Click lại icon chấm công → modal mở ở trạng thái "Đã dạy", có nút "Xóa chấm công".
- Đổi sang "Vắng" + ghi chú "Nghỉ bệnh", lưu → badge đỏ "Vắng · Nghỉ bệnh".
- Xóa chấm công → badge biến mất.

- [ ] **Step 3: Verify trên DailyAgenda (admin)**

- Ở sidebar "Hôm Nay", mỗi ca có nút "Điểm danh" và "Chấm công".
- Click "Chấm công" → modal mở với ngày hôm nay. Lưu "Dạy bù" → nút đổi thành "Dạy bù" (nền vàng).

- [ ] **Step 4: Verify chuyển tuần**

- Bấm "Tuần trước"/"Tuần sau" → badge chấm công thay đổi theo tuần (record tuần này không hiện ở tuần khác).

- [ ] **Step 5: Verify phân quyền (teacher)**

- Đăng xuất, đăng nhập bằng **tài khoản giáo viên thường**.
- Vào Lịch Dạy: hover card KHÔNG thấy icon chấm công; DailyAgenda KHÔNG có nút "Chấm công" (chỉ có "Điểm danh").

- [ ] **Step 6: Verify RLS ở DB**

Trong Supabase SQL Editor (impersonate không cần — chỉ kiểm tra dữ liệu):
```sql
select schedule_id, date, status, note from teacher_attendance order by date desc limit 10;
```
Expected: thấy các record vừa tạo.

---

## Task 11: Cập nhật seed + tài liệu

**Files:**
- Modify: `supabase/seed/seed_mock_data.sql`
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Thêm record chấm công mẫu vào seed**

Mở `supabase/seed/seed_mock_data.sql`. Tìm phần INSERT vào bảng `schedule` (mock schedule items). Sau khối đó, thêm một khối INSERT cho `teacher_attendance` dùng cùng cách tham chiếu schedule mock đang dùng trong file (theo đúng pattern biến/CTE sẵn có trong seed). Thêm 2–3 record mẫu, ví dụ (điều chỉnh tên biến cho khớp seed hiện tại):

```sql
-- Chấm công giáo viên mẫu (teacher_attendance)
insert into public.teacher_attendance (schedule_id, date, teacher_id, status, note)
select s.id, current_date, c.teacher_id, 'present', null
from public.schedule s
join public.classes c on c.id = s.class_id
where c.teacher_id in (<<danh sách teacher mock đang dùng trong file>>)
limit 2;
```

> Lưu ý: seed là **idempotent** và cleanup scope theo teacher mock. Bảng `teacher_attendance` cascade theo `schedule` nên khi seed xóa schedule mock thì record chấm công cũng tự xóa — KHÔNG cần thêm câu DELETE riêng. Xác nhận điều này đúng với cấu trúc cleanup hiện tại của file trước khi commit.

- [ ] **Step 2: Verify seed chạy lại được**

Dán toàn bộ `seed_mock_data.sql` vào Supabase SQL Editor → Run 2 lần liên tiếp.
Expected: cả 2 lần "Success", không lỗi khóa ngoại/trùng.

- [ ] **Step 3: Cập nhật CLAUDE.md**

Trong mục danh sách services (đoạn "Services đã có: ..."), thêm `teacherAttendanceService`.

Thêm một mục mới dưới phần "Routing & Layout" hoặc gần SchedulePage, nội dung:
```
- **Chấm công giáo viên** (admin): `SchedulePage` load `teacherAttendanceService.getByWeek` cho tuần đang xem (chỉ khi `canCheckTeacherAttendance`), build `Map<"scheduleId_date", record>`, truyền xuống `WeeklyGrid`/`DailyAgenda`. Chấm công qua `TeacherAttendanceModal` (3 trạng thái: present/absent/makeup + note). Bảng `teacher_attendance` (migration 20260620000001), unique `(schedule_id, date)`, RLS admin full write / teacher read-only. Hằng số trạng thái ở `src/components/schedule/attendanceStatus.js`.
```

Trong mục "Phân quyền UI", thêm `canCheckTeacherAttendance` vào danh sách cờ của `usePermissions()`.

- [ ] **Step 4: Cập nhật README.md**

Thêm tính năng "Chấm công giáo viên" vào phần mô tả tính năng/trang Lịch Dạy (giữ văn phong hiện có của README).

- [ ] **Step 5: Commit**

```bash
git add supabase/seed/seed_mock_data.sql CLAUDE.md README.md
git commit -m "docs: document teacher attendance feature + seed sample data"
```

---

## Self-Review Notes

- **Spec coverage:** Bảng + RLS (T1), service getByWeek/upsert/remove (T3), UI WeeklyGrid+DailyAgenda+Modal (T5–T9), phân quyền admin-only (T4 + guard ở mọi component), 3 trạng thái + note (T2/T5), không có báo cáo tổng hợp (đúng scope). ✓
- **Type consistency:** key map `"${scheduleId}_${date}"` nhất quán giữa SchedulePage (build), WeeklyGrid, DailyAgenda, Modal lookup. `onCheckIn(item, date)` signature nhất quán. `attendanceRecord`/`record` shape từ `fromDB` (`status`, `note`). ✓
- **Lưu ý implement:** `weekStart` là Thứ Hai (theo `getWeekStart`); `dateForDay` tính offset từ Mon — đã xử lý CN (0)→offset 6. Verify khớp khi test (Task 10 Step 4).
