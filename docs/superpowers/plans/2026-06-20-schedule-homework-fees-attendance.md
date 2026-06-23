# 4 cải tiến UX (Bài tập · Học phí · Chấm công · Lịch dạy tự động) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bốn chỉnh sửa UX độc lập: (#1) +Thêm bài tập khởi tạo "Hoàn tất"; (#2) trang Học phí không nháy skeleton sau khi sửa thanh toán; (#3) chấm công giáo viên hiển thị rõ trên thẻ lịch tuần (viền màu trái + chip góc phải); (#4) lịch dạy tự động đồng bộ từ lịch học có cấu trúc của lớp.

**Architecture:** #1–#3 chỉ sửa component/page React, không đụng DB. #4 thêm cột cấu trúc vào `classes` (migration), map ở `classService`, và đồng bộ xuống bảng `schedule` qua `scheduleService.syncForClass` được gọi bên trong `classService.create/update`. Lịch học của lớp là nguồn chân lý, lưới `schedule` là projection.

**Tech Stack:** React 18 + Vite, Tailwind (navy tokens), Supabase (Postgres). **Không có test runner** → kiểm thử bằng `npm run build` (bắt lỗi cú pháp/import) + chạy `npm run dev` quan sát thủ công. Migration #4 phải Run thủ công trong Supabase SQL Editor.

**Spec nguồn:** `docs/superpowers/specs/2026-06-20-schedule-homework-fees-attendance-design.md`

---

## Task 1: #1 — +Thêm bài tập khởi tạo "Hoàn tất"

**Files:**
- Modify: `src/pages/ClassDetailPage/tabs/HomeworkTab.jsx:124`

- [ ] **Step 1: Đổi progress mặc định khi thêm bản ghi**

Trong `handleAddRecord`, đổi giá trị `progress` truyền vào `homeworkService.create`:

```jsx
      await homeworkService.create({
        sessionId: activeSessionId,
        studentId,
        progress: 'done',
        title: sharedTitle,
        note: '',
      })
```

(Chỉ đổi `'not_done'` → `'done'`. Không sửa `ProgressBadge.jsx` — vòng lặp `['done','in_progress','not_done']` đã đúng.)

- [ ] **Step 2: Build kiểm tra không lỗi**

Run: `npm run build`
Expected: build thành công, không lỗi.

- [ ] **Step 3: Kiểm thử thủ công**

Run: `npm run dev` → mở một lớp → tab **Bài Tập** → chế độ **Theo Buổi** → chọn một buổi → ở cột "Kết quả bài tập" của một học viên chưa có bản ghi, bấm **+Thêm**.
Expected: badge hiện **"Hoàn tất"** ngay. Bấm badge lần 1 → "Chưa hoàn tất"; lần 2 → "Không nộp"; lần 3 → "Hoàn tất".

- [ ] **Step 4: Commit**

```bash
git add src/pages/ClassDetailPage/tabs/HomeworkTab.jsx
git commit -m "fix(homework): +Thêm khởi tạo trạng thái Hoàn tất thay vì Không nộp"
```

---

## Task 2: #2 — Học phí không nháy skeleton sau khi sửa thanh toán

**Files:**
- Modify: `src/pages/FeesPage.jsx:51-73` và `:236-241`

- [ ] **Step 1: Thêm tham số `silent` cho `refresh`**

Thay block `refresh` (dòng 51–61):

```jsx
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await feeService.buildFeesRows(year, month)
      setRows(data)
    } catch (e) {
      toast.error('Không tải được dữ liệu học phí')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [year, month])
```

- [ ] **Step 2: `handleSave` dùng refresh im lặng**

Trong `handleSave`, đổi `refresh()` → `refresh(true)`:

```jsx
  const handleSave = async (data) => {
    try {
      await paymentService.create({ ...data, period: data.period })
      toast.success('Đã ghi nhận thanh toán!')
      refresh(true)
    } catch {
      toast.error('Lưu không thành công, vui lòng thử lại.')
    }
  }
```

- [ ] **Step 3: Bảng học phí refetch im lặng khi sửa/xóa**

Đổi prop `onRefresh` của `FeesTable` (dòng ~240) để gọi refresh im lặng:

```jsx
        <FeesTable
            rows={filteredRows}
            period={currentPeriod}
            onAddPayment={openAdd}
            onRefresh={() => refresh(true)}
        />
```

(Lưu ý: `useEffect(() => { refresh() }, [refresh])` giữ nguyên — lần tải đầu và khi đổi tháng/năm vẫn hiện skeleton bình thường.)

- [ ] **Step 4: Build kiểm tra**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 5: Kiểm thử thủ công**

Run: `npm run dev` → trang **Học Phí** (đăng nhập admin) → bấm vào một hàng học viên để mở panel lịch sử → **Sửa** một khoản rồi **Lưu** (và thử **Xóa**).
Expected: bảng phía sau **không nháy skeleton**; số liệu (Đã đóng / Còn nợ / summary cards) cập nhật mượt tại chỗ. Đổi tháng ở top bar vẫn thấy skeleton như cũ.

- [ ] **Step 6: Commit**

```bash
git add src/pages/FeesPage.jsx
git commit -m "fix(fees): refresh im lặng sau khi sửa/xóa thanh toán (bỏ nháy skeleton)"
```

---

## Task 3: #3 — Chấm công phương án B trên thẻ lịch tuần

**Files:**
- Modify: `src/components/schedule/attendanceStatus.js`
- Modify: `src/components/schedule/ScheduleCard.jsx` (viết lại)

- [ ] **Step 1: Thêm class viền-trái cho mỗi trạng thái**

Trong `attendanceStatus.js`, thêm field `bar` (Tailwind token, không hard-code hex) cho mỗi trạng thái:

```js
// Trạng thái chấm công giáo viên — dùng chung giữa modal, card, agenda.
// Màu dùng Tailwind tokens (không hard-code hex).
export const ATTENDANCE_STATUSES = [
  { value: 'present', label: 'Đã dạy', icon: '✅', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50',  border: 'border-green-200', bar: 'border-l-green-500' },
  { value: 'absent',  label: 'Vắng',   icon: '❌', dot: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50',    border: 'border-red-200',   bar: 'border-l-red-500'   },
  { value: 'makeup',  label: 'Dạy bù', icon: '🔄', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50',  border: 'border-amber-200', bar: 'border-l-amber-500' },
]

export const getAttendanceStatus = (value) =>
  ATTENDANCE_STATUSES.find(s => s.value === value) ?? null
```

- [ ] **Step 2: Viết lại `ScheduleCard.jsx` theo phương án B**

Thay toàn bộ nội dung file:

```jsx
import { clsx } from 'clsx'
import { Clock, MapPin, Users } from 'lucide-react'
import { getAttendanceStatus } from './attendanceStatus'

// ─── Color Mapping by courseType ──────────────────────────
export const COURSE_COLORS = {
  'IELTS':     { bg: 'bg-navy-100',   border: 'border-navy-300',   text: 'text-navy-800',   dot: 'bg-navy-500'   },
  'TOEIC':     { bg: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  'Giao Tiếp': { bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  'default':   { bg: 'bg-gray-50',    border: 'border-gray-200',   text: 'text-gray-600',   dot: 'bg-gray-400'   },
}

export const getCourseColor = (courseType) =>
  COURSE_COLORS[courseType] ?? COURSE_COLORS['default']

// ─── ScheduleCard ──────────────────────────────────────────
export const ScheduleCard = ({ item, cls, studentCount, showTeacher, onEdit, canCheckAttendance = false, attendanceRecord = null, onCheckIn }) => {
  const color = getCourseColor(cls?.courseType)
  const att = getAttendanceStatus(attendanceRecord?.status)

  return (
    <div
      className={clsx(
        'group relative rounded-xl border p-2.5 cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5',
        color.bg, color.border,
        att && clsx('border-l-4', att.bar)
      )}
      onClick={() => onEdit?.(item)}
    >
      {/* Header: course dot + class name + always-visible attendance chip */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={clsx('w-2 h-2 rounded-full shrink-0', color.dot)} />
        <span className={clsx('text-xs font-semibold truncate', color.text)}>
          {cls?.name ?? '—'}
        </span>
        {canCheckAttendance && (
          <button
            className="ml-auto shrink-0"
            title="Chấm công giáo viên"
            onClick={(e) => { e.stopPropagation(); onCheckIn?.(item) }}
          >
            {att ? (
              <span className={clsx(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold border',
                att.bg, att.text, att.border
              )}>
                <span className={clsx('w-1.5 h-1.5 rounded-full', att.dot)} />
                {att.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-navy-600 bg-navy-50 border border-navy-200 hover:bg-navy-100 transition-colors">
                Chấm
              </span>
            )}
          </button>
        )}
      </div>

      {/* Teacher name — only shown in admin "all teachers" view */}
      {showTeacher && cls?.teacherName && (
        <div className={clsx('text-xs mb-1 truncate opacity-70', color.text)}>
          {cls.teacherName}
        </div>
      )}

      {/* Time */}
      <div className={clsx('flex items-center gap-1 text-xs', color.text)}>
        <Clock size={11} className="shrink-0" />
        <span>{item.startTime}–{item.endTime}</span>
      </div>

      {/* Room */}
      {item.room && (
        <div className={clsx('flex items-center gap-1 text-xs mt-0.5', color.text, 'opacity-80')}>
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{item.room}</span>
        </div>
      )}

      {/* Student count */}
      {studentCount != null && (
        <div className={clsx('flex items-center gap-1 text-xs mt-0.5', color.text, 'opacity-70')}>
          <Users size={11} className="shrink-0" />
          <span>{studentCount} HV</span>
        </div>
      )}

      {/* Attendance note (status itself shown via stripe + chip) */}
      {attendanceRecord?.note && (
        <div className={clsx('text-xs mt-1.5 pt-1.5 border-t truncate', color.text, color.border, 'opacity-80')}>
          {attendanceRecord.note}
        </div>
      )}
    </div>
  )
}
```

Thay đổi chính so với bản cũ: bỏ import `Edit2`, `CheckSquare`; bỏ icon chấm công + icon bút chỉ-hiện-khi-rê-chuột; thêm viền trái màu trạng thái + chip luôn hiện ở góc phải; bỏ badge trạng thái cũ ở đáy, chỉ giữ dòng note.

- [ ] **Step 3: Build kiểm tra**

Run: `npm run build`
Expected: build thành công, không cảnh báo import thừa gây fail.

- [ ] **Step 4: Kiểm thử thủ công (admin)**

Run: `npm run dev` → đăng nhập **admin** → trang **Lịch Dạy**.
Expected:
- Mỗi thẻ có chip ở góc trên-phải: chưa chấm = chip **"Chấm"** (navy nhạt) luôn hiện; đã chấm = pill màu (dot + "Đã dạy"/"Vắng"/"Dạy bù") + viền trái cùng màu.
- Bấm chip → mở `TeacherAttendanceModal`, **không** mở modal sửa lịch. Chọn trạng thái + lưu → chip & viền trái đổi màu.
- Bấm vào thân thẻ (ngoài chip) → mở modal sửa lịch như cũ.
- Đăng nhập **giáo viên thường** (không có quyền chấm công) → không thấy chip; bấm thẻ vẫn mở sửa lịch.

- [ ] **Step 5: Commit**

```bash
git add src/components/schedule/attendanceStatus.js src/components/schedule/ScheduleCard.jsx
git commit -m "feat(schedule): chấm công hiển thị rõ trên thẻ (viền màu trái + chip luôn hiện)"
```

---

## Task 4: #4a — Migration thêm lịch học có cấu trúc cho lớp

**Files:**
- Create: `supabase/migrations/20260620000002_add_class_recurring_schedule.sql`

- [ ] **Step 1: Tạo file migration**

```sql
-- Lịch học có cấu trúc cho lớp → dùng đồng bộ tự động xuống bảng schedule.
-- schedule_day_list: mảng thứ trong tuần theo quy ước JS (0=CN … 6=T7), VD lớp 3-5-7 → [2,4,6]
ALTER TABLE classes
  ADD COLUMN schedule_day_list jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN start_time text,
  ADD COLUMN end_time text,
  ADD COLUMN room text;
```

- [ ] **Step 2: Chạy migration trong Supabase**

Mở **Supabase SQL Editor** → dán nội dung file → **Run**.
Expected: "Success. No rows returned". Kiểm tra cột mới: `SELECT schedule_day_list, start_time, end_time, room FROM classes LIMIT 1;` chạy được.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260620000002_add_class_recurring_schedule.sql
git commit -m "feat(db): thêm lịch học có cấu trúc cho classes (schedule_day_list, start/end_time, room)"
```

---

## Task 5: #4b — classService map + scheduleService.syncForClass

**Files:**
- Modify: `src/services/scheduleService.js` (thêm method `syncForClass`)
- Modify: `src/services/classService.js` (map field mới + gọi sync trong create/update)

- [ ] **Step 1: Thêm `syncForClass` vào scheduleService**

Thêm method này vào object `scheduleService` (sau `remove`):

```js
  // Đồng bộ lịch dạy của một lớp theo lịch học có cấu trúc.
  // Chỉ chạy khi đủ dayList + startTime + endTime; dayList rỗng → no-op (không xóa oan).
  async syncForClass(classId, { dayList, startTime, endTime, room }) {
    if (!classId || !Array.isArray(dayList) || dayList.length === 0 || !startTime || !endTime) return
    const wanted = new Set(dayList.map(Number))

    const { data: existing, error: selErr } = await supabase
      .from('schedule')
      .select('id, day_of_week, note')
      .eq('class_id', classId)
    if (selErr) throw new Error(selErr.message)

    const existingByDay = new Map((existing ?? []).map(r => [r.day_of_week, r]))

    // Upsert các thứ được chọn (giữ nguyên note nếu đã có)
    for (const day of wanted) {
      const found = existingByDay.get(day)
      if (found) {
        const { error } = await supabase
          .from('schedule')
          .update({ start_time: startTime, end_time: endTime, room: room ?? null })
          .eq('id', found.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('schedule')
          .insert({ class_id: classId, day_of_week: day, start_time: startTime, end_time: endTime, room: room ?? null, note: null })
        if (error) throw new Error(error.message)
      }
    }

    // Xóa các thứ không còn được chọn
    const toDelete = (existing ?? []).filter(r => !wanted.has(r.day_of_week)).map(r => r.id)
    if (toDelete.length > 0) {
      const { error } = await supabase.from('schedule').delete().in('id', toDelete)
      if (error) throw new Error(error.message)
    }
  },
```

- [ ] **Step 2: Map field mới trong classService.fromDB**

Thêm vào object trả về của `fromDB` (sau `scheduleTime`):

```js
  scheduleDayList: Array.isArray(row.schedule_day_list) ? row.schedule_day_list : [],
  startTime: row.start_time,
  endTime: row.end_time,
  room: row.room,
```

- [ ] **Step 3: Thêm helper suy ra chuỗi hiển thị + cập nhật toDB**

Thêm helper trên `toDB` (sau `DEFAULT_SKILL_CONFIG`):

```js
const DAY_LABELS_SHORT = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' }
// Sắp theo Thứ 2 trước, CN cuối
const deriveScheduleDays = (dayList) =>
  Array.isArray(dayList) && dayList.length > 0
    ? [...dayList]
        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
        .map(d => DAY_LABELS_SHORT[d])
        .join('-')
    : null
const deriveScheduleTime = (s, e) => (s && e) ? `${s}-${e}` : null
```

Sửa `toDB` — bỏ 2 dòng `schedule_days`/`schedule_time` khỏi object cố định, và thêm block có điều kiện cho lịch cấu trúc (tránh ghi đè khi update riêng teacher):

```js
const toDB = (data) => {
  const obj = {
    name: data.name,
    level: data.level ?? null,
    max_students: data.maxStudents ?? null,
    course_type: data.courseType ?? null,
    start_date: data.startDate ?? null,
    skill_config: Array.isArray(data.skillConfig) && data.skillConfig.length > 0
      ? data.skillConfig.map((sk, i) => ({ name: sk.name, order: sk.order ?? i }))
      : DEFAULT_SKILL_CONFIG,
  }
  if (data.teacherId) obj.teacher_id = data.teacherId
  // Lịch học có cấu trúc — chỉ ghi khi ClassModal cung cấp (không đụng khi update riêng teacher)
  if (data.scheduleDayList !== undefined) {
    obj.schedule_day_list = Array.isArray(data.scheduleDayList) ? data.scheduleDayList.map(Number) : []
    obj.start_time = data.startTime ?? null
    obj.end_time = data.endTime ?? null
    obj.room = data.room ?? null
    obj.schedule_days = deriveScheduleDays(data.scheduleDayList)
    obj.schedule_time = deriveScheduleTime(data.startTime, data.endTime)
  }
  return obj
}
```

- [ ] **Step 4: Import scheduleService + gọi sync trong create/update**

Đầu file `classService.js`, thêm import (sau import `getUid`):

```js
import { scheduleService } from './scheduleService'
```

Trong `classService.create`, sau khi insert thành công và trước `return fromDB(row)`:

```js
  async create(data) {
    const teacher_id = data.teacherId ?? await getUid()
    const { data: row, error } = await supabase
      .from('classes')
      .insert({ ...toDB(data), teacher_id })
      .select()
      .single()
    if (error) throw new Error(error.message)
    await scheduleService.syncForClass(row.id, {
      dayList: data.scheduleDayList,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room,
    })
    return fromDB(row)
  },
```

Trong `classService.update`, sau khi update thành công:

```js
  async update(id, data) {
    const { error } = await supabase
      .from('classes')
      .update(toDB(data))
      .eq('id', id)
    if (error) throw new Error(error.message)
    if (data.scheduleDayList !== undefined) {
      await scheduleService.syncForClass(id, {
        dayList: data.scheduleDayList,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      })
    }
  },
```

(Guard `data.scheduleDayList !== undefined` ở `update` để update riêng teacher từ AdminPanel không kích hoạt sync.)

- [ ] **Step 5: Build kiểm tra**

Run: `npm run build`
Expected: build thành công (không lỗi import vòng — `scheduleService` không import `classService`).

- [ ] **Step 6: Commit**

```bash
git add src/services/scheduleService.js src/services/classService.js
git commit -m "feat(schedule): scheduleService.syncForClass + classService map lịch học cấu trúc"
```

---

## Task 6: #4c — ClassModal: chọn thứ + giờ có cấu trúc

**Files:**
- Modify: `src/components/classes/ClassModal.jsx`

- [ ] **Step 1: Thêm hằng số ngày + cập nhật state khởi tạo**

Thêm dưới các import:

```js
const DAY_OPTIONS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
]
```

Trong `useState` khởi tạo `formData`, thay `scheduleDays: ''`/`scheduleTime: ''` bằng:

```js
    scheduleDayList: [],
    startTime: '',
    endTime: '',
    room: '',
```

- [ ] **Step 2: Cập nhật nạp form khi mở (cả nhánh edit và create)**

Nhánh `if (classItem)` — thay 2 dòng `scheduleDays`/`scheduleTime` bằng:

```js
          scheduleDayList: Array.isArray(classItem.scheduleDayList) ? classItem.scheduleDayList : [],
          startTime: classItem.startTime || '',
          endTime: classItem.endTime || '',
          room: classItem.room || '',
```

Nhánh `else` (tạo mới) — thay 2 dòng tương ứng bằng:

```js
          scheduleDayList: [],
          startTime: '',
          endTime: '',
          room: '',
```

- [ ] **Step 3: Thêm hàm toggle ngày + validate giờ**

Thêm trong component (sau `handleChange`):

```js
  const toggleDay = (d) => {
    setFormData(prev => ({
      ...prev,
      scheduleDayList: prev.scheduleDayList.includes(d)
        ? prev.scheduleDayList.filter(x => x !== d)
        : [...prev.scheduleDayList, d],
    }))
  }
```

Trong `handleSubmit`, thêm validate giờ trước khi check `newErrors` (sau check teacherId):

```js
    if (formData.scheduleDayList.length > 0) {
      if (!formData.startTime) newErrors.startTime = 'Vui lòng nhập giờ bắt đầu'
      if (!formData.endTime) newErrors.endTime = 'Vui lòng nhập giờ kết thúc'
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime)
        newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu'
    }
```

- [ ] **Step 4: Thay UI 2 ô chữ tự do bằng checkbox thứ + giờ + phòng**

Thay block (hiện là `<div className="grid grid-cols-2 gap-4">` chứa "Lịch học (Thứ)" và "Giờ học"):

```jsx
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-navy-700">Lịch học (Thứ)</label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_OPTIONS.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  formData.scheduleDayList.includes(d.value)
                    ? 'bg-navy-800 text-white border-navy-800'
                    : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Giờ bắt đầu"
            name="startTime"
            type="time"
            value={formData.startTime}
            onChange={handleChange}
            error={errors.startTime}
          />
          <Input
            label="Giờ kết thúc"
            name="endTime"
            type="time"
            value={formData.endTime}
            onChange={handleChange}
            error={errors.endTime}
          />
        </div>

        <Input
          label="Phòng học (tùy chọn)"
          name="room"
          value={formData.room}
          onChange={handleChange}
          placeholder="VD: Phòng 102"
        />
```

(`handleChange` đã set theo `name`, nên `startTime`/`endTime`/`room` tự động hoạt động. `onSave({ ...formData, ... })` ở dòng hiện có sẽ tự gồm `scheduleDayList`, `startTime`, `endTime`, `room`.)

- [ ] **Step 5: Build kiểm tra**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 6: Kiểm thử thủ công (admin)**

Run: `npm run dev` → đăng nhập admin → trang **Lớp Học** → **Thêm lớp**: chọn các thứ **T3, T5, T7**, giờ **19:00 → 20:30**, phòng tuỳ ý → Lưu.
Expected:
- Không lỗi; lớp được tạo.
- Sang trang **Lịch Dạy** → thấy lớp đó tự xuất hiện ở **Thứ 3, Thứ 5, Thứ 7**, mỗi ca 19:00–20:30.
- Mở lại lớp (Sửa) → các thứ đã tick đúng, giờ hiển thị đúng. Bỏ tick T7 → Lưu → trên Lịch Dạy ca Thứ 7 biến mất; T3/T5 còn nguyên.
- Thử validate: tick một thứ nhưng để trống giờ → báo lỗi, không lưu.

- [ ] **Step 7: Commit**

```bash
git add src/components/classes/ClassModal.jsx
git commit -m "feat(classes): chọn thứ + giờ có cấu trúc trong ClassModal (tự xếp lịch dạy)"
```

---

## Task 7: #4d — Cập nhật seed cho khớp schema

**Files:**
- Modify: `supabase/seed/seed_mock_data.sql` (block INSERT INTO classes, dòng ~160–199)

- [ ] **Step 1: Thêm cột mới vào danh sách cột của INSERT classes**

Đổi dòng cột (dòng ~161–162) thành:

```sql
INSERT INTO public.classes
  (id, teacher_id, name, level, course_type, max_students,
   schedule_days, schedule_time, schedule_day_list, start_time, end_time, room,
   start_date, skill_config)
```

- [ ] **Step 2: Thêm giá trị cấu trúc cho 4 lớp**

Cập nhật mỗi VALUES để chèn `schedule_day_list, start_time, end_time, room` ngay sau `schedule_time` (giữ nguyên các cột khác). Cụ thể:

c01 (IELTS Cơ Bản, 'Thứ 2, Thứ 5', '08:00 – 10:00'):
```sql
   'Thứ 2, Thứ 5', '08:00 – 10:00', '[1,4]'::jsonb, '08:00', '10:00', 'Phòng 101',
```
c02 (IELTS Nâng Cao, 'Thứ 3', '14:00 – 16:00'):
```sql
   'Thứ 3', '14:00 – 16:00', '[2]'::jsonb, '14:00', '16:00', 'Phòng 102',
```
c03 (TOEIC, 'Thứ 4', '18:00 – 20:00'):
```sql
   'Thứ 4', '18:00 – 20:00', '[3]'::jsonb, '18:00', '20:00', 'Phòng 103',
```
c04 (Giao Tiếp, 'Thứ 7', '09:00 – 11:00'):
```sql
   'Thứ 7', '09:00 – 11:00', '[6]'::jsonb, '09:00', '11:00', 'Phòng 104',
```

(Chèn vào đúng vị trí giữa `schedule_time` và `start_date` cho từng lớp; `start_date` + `skill_config` giữ nguyên phía sau.)

- [ ] **Step 3: Thêm block INSERT vào bảng schedule (để Lịch Dạy có sẵn dữ liệu)**

Thêm ngay **sau** block INSERT classes (trước "BƯỚC 5: Enrollments"):

```sql
-- ====================================================
-- BƯỚC 4b : Schedule (lịch dạy suy ra từ lịch học lớp)
-- ====================================================
INSERT INTO public.schedule (class_id, day_of_week, start_time, end_time, room)
VALUES
  ('02000000-0000-0000-0000-000000000001', 1, '08:00', '10:00', 'Phòng 101'),
  ('02000000-0000-0000-0000-000000000001', 4, '08:00', '10:00', 'Phòng 101'),
  ('02000000-0000-0000-0000-000000000002', 2, '14:00', '16:00', 'Phòng 102'),
  ('02000000-0000-0000-0000-000000000003', 3, '18:00', '20:00', 'Phòng 103'),
  ('02000000-0000-0000-0000-000000000004', 6, '09:00', '11:00', 'Phòng 104');
```

(Nếu seed đã có dọn dẹp scope theo teacher mock ở đầu file, bảng `schedule` tham chiếu `class_id` sẽ tự bị xóa theo `ON DELETE CASCADE` khi xóa classes — không cần cleanup riêng. Xác nhận khi chạy: chạy lại seed lần 2 không lỗi trùng.)

- [ ] **Step 4: Chạy lại seed kiểm tra idempotent**

Điền 3 placeholder email rồi dán toàn bộ seed vào **Supabase SQL Editor** → Run. Chạy **2 lần** liên tiếp.
Expected: cả 2 lần "Success", không lỗi khóa trùng. Trang Lịch Dạy hiển thị 5 ca của 4 lớp đúng thứ/giờ.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed/seed_mock_data.sql
git commit -m "chore(seed): thêm lịch học cấu trúc + schedule rows cho lớp mock"
```

---

## Task 8: Cập nhật tài liệu (bắt buộc theo CLAUDE.md)

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Cập nhật CLAUDE.md**

Trong mục **"Model học sinh"/"Model lớp"** (gần các migration), thêm đoạn về model lớp:

```markdown
## Model lịch học của lớp (migration 20260620000002)
- **`classes.schedule_day_list`** (jsonb): mảng thứ trong tuần theo quy ước JS `0=CN…6=T7` (VD lớp 3-5-7 → `[2,4,6]`). `start_time`/`end_time` (text `HH:MM`), `room` (text) — lịch học cố định, **cùng giờ mọi buổi**.
- `classService.fromDB/toDB` map `scheduleDayList/startTime/endTime/room`; `toDB` tự suy ra `schedule_days`/`schedule_time` (chuỗi hiển thị, tương thích ngược) và **chỉ ghi block lịch khi `data.scheduleDayList !== undefined`** (để update riêng teacher không xoá lịch).
- **Tự đồng bộ lịch dạy:** `scheduleService.syncForClass(classId, { dayList, startTime, endTime, room })` được gọi trong `classService.create/update` → upsert hàng `schedule` theo `(class_id, day_of_week)` cho thứ được chọn, xóa thứ bỏ chọn (giữ `note` từng ca). `dayList` rỗng → no-op. Lịch học của lớp là nguồn chân lý; lưới `schedule` là projection.
- `ClassModal`: chọn thứ bằng nhóm nút T2…CN + 2 ô `type=time` + ô phòng (thay 2 ô chữ tự do cũ).
```

Trong mục mô tả `SchedulePage`/chấm công, thêm 1 dòng:

```markdown
- **ScheduleCard (chấm công):** trạng thái chấm công hiển thị bằng **viền màu trái** (`att.bar` trong `attendanceStatus.js`) + **chip luôn hiện** ở góc phải (đã chấm = pill màu; chưa chấm = chip "Chấm"). Bấm chip = mở `TeacherAttendanceModal` (stopPropagation); bấm thân thẻ = sửa lịch. Chỉ hiện khi `canCheckTeacherAttendance`.
```

- [ ] **Step 2: Cập nhật README.md**

Tìm mục mô tả tính năng lịch/lớp trong `README.md` và thêm gạch đầu dòng:

```markdown
- Lịch dạy tự động: đặt lịch học của lớp (chọn thứ + giờ) → các ca tự xuất hiện và đồng bộ trên trang Lịch Dạy.
- Chấm công giáo viên hiển thị trực quan ngay trên thẻ lịch tuần (viền màu + chip trạng thái).
```

(Nếu README chưa có mục tính năng tương ứng, thêm vào phần "Tính năng" gần nhất.)

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: cập nhật CLAUDE.md + README cho lịch dạy tự động & chấm công thẻ"
```

---

## Ghi chú thực thi
- **Thứ tự bắt buộc:** Task 4 (migration) phải chạy trên Supabase **trước** khi kiểm thử Task 5–7 ở `npm run dev`, nếu không truy vấn cột mới sẽ lỗi.
- Task 1, 2, 3 độc lập hoàn toàn — có thể làm trước, theo thứ tự nào cũng được.
- Không có test runner: dùng `npm run build` làm cổng kiểm tra tự động + kiểm thử thủ công theo từng task.
