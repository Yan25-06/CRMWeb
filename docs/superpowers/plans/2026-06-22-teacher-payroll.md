# Teacher Payroll (Lương giáo viên & dạy thay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho admin chấm công + tính lương giáo viên theo lịch dạy cố định, hỗ trợ dạy thay (chuyển công buổi sang người dạy thay), và một tab "Bảng Lương" theo tháng.

**Architecture:** Thêm `monthly_salary` vào `teachers` và `substitute_teacher_id` vào `teacher_attendance` (migration + RLS). Lương tính **client-side** bằng hàm thuần trong `src/utils/payroll.js`. Trang `schedule` đổi tên hiển thị "Giảng Dạy" và tách 2 tab: Lịch Dạy (lưới + chấm công + dropdown dạy thay) và Bảng Lương (bảng theo tháng + export). Admin xem toàn bộ; giáo viên thường chỉ xem dòng của mình.

**Tech Stack:** React 18 + Vite, Tailwind (navy tokens), Supabase JS, lucide-react, clsx, xlsx/jspdf (lazy-loaded export). **Không có test runner** → verify bằng `npm run build` + một script `node` tạm cho hàm thuần + kiểm thử UI thủ công.

**Spec nguồn:** `specs/2026-06-22-teacher-payroll-design.md`

**Quy ước commit:** kết thúc message commit bằng:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## File Structure

**Tạo mới:**
- `supabase/migrations/20260622000001_add_teacher_salary_and_substitute.sql` — schema + RLS.
- `src/utils/payroll.js` — hàm thuần `countWeekdayOccurrences` + `buildPayrollRows` (logic tính lương, không import supabase → test được bằng node).
- `src/components/schedule/PayrollTab.jsx` — UI tab Bảng Lương (month picker + bảng + export).

**Sửa:**
- `src/services/classService.js` — `teacherService`: select `monthly_salary`, map `monthlySalary`, mở rộng `update(id, { name, monthlySalary })`.
- `src/services/teacherAttendanceService.js` — map `substituteTeacherId`, `upsert` nhận `substituteTeacherId`, thêm `getByMonth`.
- `src/hooks/usePermissions.js` — thêm cờ `canViewAllPayroll`.
- `src/pages/AdminPanelPage.jsx` — ô nhập "Lương tháng" cho mỗi giáo viên.
- `src/components/schedule/ScheduleCard.jsx` — dropdown "Dạy thay" khi Vắng.
- `src/components/schedule/WeeklyGrid.jsx` — truyền `teachers` + `onSetSubstitute` xuống card.
- `src/pages/SchedulePage.jsx` — đổi tên "Giảng Dạy", 2 tab, handler dạy thay, render PayrollTab.
- `src/components/layout/Navbar.jsx` — đổi label item `schedule` thành "Giảng Dạy".
- `CLAUDE.md`, `README.md`, `supabase/seed/seed_mock_data.sql` — đồng bộ tài liệu/seed.

---

## Task 1: Migration — salary + substitute + RLS

**Files:**
- Create: `supabase/migrations/20260622000001_add_teacher_salary_and_substitute.sql`

- [ ] **Step 1: Viết migration**

```sql
-- =========================================================================
-- Migration: Teacher salary + substitute teacher (lương giáo viên & dạy thay)
-- Change: add-teacher-payroll
--
-- - teachers.monthly_salary: lương tháng cố định (admin set).
-- - teacher_attendance.substitute_teacher_id: giáo viên dạy thay khi status='absent'.
-- - Mở rộng policy SELECT của teacher_attendance để GV dạy thay đọc được buổi
--   mình dạy thay (record đó thuộc người vắng).
--
-- Rollback:
--   alter table public.teachers drop column monthly_salary;
--   alter table public.teacher_attendance drop column substitute_teacher_id;
--   (khôi phục policy SELECT cũ chỉ teacher_id = auth.uid() or is_admin())
-- =========================================================================

alter table public.teachers
  add column if not exists monthly_salary numeric;

alter table public.teacher_attendance
  add column if not exists substitute_teacher_id uuid references public.teachers(id);

-- Mở rộng policy SELECT: cho phép giáo viên dạy thay đọc record.
drop policy if exists "teacher_attendance: teacher or admin select" on public.teacher_attendance;
create policy "teacher_attendance: teacher or admin select"
  on public.teacher_attendance for select
  using (
    teacher_id = auth.uid()
    or substitute_teacher_id = auth.uid()
    or is_admin()
  );
```

- [ ] **Step 2: Áp dụng migration (thủ công)**

Dán nội dung file vào **Supabase SQL Editor** và Run (giống quy trình seed). Hoặc nếu dùng Supabase CLI: `supabase db push`.
Expected: chạy thành công, không lỗi. `teachers` có cột `monthly_salary`; `teacher_attendance` có `substitute_teacher_id`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260622000001_add_teacher_salary_and_substitute.sql
git commit -m "feat(db): teacher monthly_salary + attendance substitute_teacher_id + RLS"
```

---

## Task 2: teacherAttendanceService — substitute + getByMonth

**Files:**
- Modify: `src/services/teacherAttendanceService.js`

- [ ] **Step 1: Map `substituteTeacherId` trong `fromDB`/`toDB`**

Thay khối `fromDB`/`toDB` hiện tại bằng:

```js
const fromDB = (row) => row ? {
  id: row.id,
  scheduleId: row.schedule_id,
  date: row.date,
  teacherId: row.teacher_id,
  status: row.status,
  note: row.note,
  substituteTeacherId: row.substitute_teacher_id ?? null,
  createdAt: row.created_at,
} : null

const toDB = (data) => ({
  schedule_id: data.scheduleId,
  date: data.date,
  teacher_id: data.teacherId,
  status: data.status,
  note: data.note ?? null,
  substitute_teacher_id: data.substituteTeacherId ?? null,
})
```

- [ ] **Step 2: `upsert` nhận `substituteTeacherId`**

Thay chữ ký + thân `upsert`:

```js
  // Tạo hoặc cập nhật record theo (schedule_id, date).
  async upsert({ scheduleId, date, teacherId, status, note, substituteTeacherId }) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert(toDB({ scheduleId, date, teacherId, status, note, substituteTeacherId }), {
        onConflict: 'schedule_id,date',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },
```

- [ ] **Step 3: Thêm `getByMonth`**

Thêm method này vào object `teacherAttendanceService` (ngay sau `getByWeek`):

```js
  // Lấy mọi record trong một tháng (year + month 1-12) cho bảng lương.
  async getByMonth(year, month) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select('*')
      .gte('date', from)
      .lte('date', to)
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build thành công, không lỗi import/syntax.

- [ ] **Step 5: Commit**

```bash
git add src/services/teacherAttendanceService.js
git commit -m "feat(service): teacher_attendance substitute + getByMonth"
```

---

## Task 3: teacherService — monthly_salary + update signature

**Files:**
- Modify: `src/services/classService.js` (object `teacherService`, dòng 68-93)

- [ ] **Step 1: select thêm `monthly_salary` và trả về camelCase**

Thay `teacherService.getAll`:

```js
  async getAll() {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, name, email, is_admin, monthly_salary')
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []).map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      is_admin: t.is_admin,
      monthlySalary: t.monthly_salary ?? null,
    }))
  },
```

> Lưu ý: trước đây `getAll` trả thẳng row snake_case. Giờ trả object có `monthlySalary` nhưng GIỮ `id/name/email/is_admin` y nguyên để mọi nơi đang dùng (`AdminPanelPage`, `SchedulePage` filter) không vỡ.

- [ ] **Step 2: Mở rộng `teacherService.update`**

Thay `update`:

```js
  async update(id, { name, monthlySalary }) {
    const payload = {}
    if (name !== undefined) payload.name = name
    if (monthlySalary !== undefined) payload.monthly_salary = monthlySalary
    const { error } = await supabase
      .from('teachers')
      .update(payload)
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
```

> `useAuth` đã `select('*')` nên profile teacher tự có `monthly_salary` — không cần sửa useAuth.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 4: Commit**

```bash
git add src/services/classService.js
git commit -m "feat(service): teacher monthlySalary in getAll + update"
```

---

## Task 4: Hàm thuần tính lương (`src/utils/payroll.js`) + node sanity test

**Files:**
- Create: `src/utils/payroll.js`
- Temp test: `tmp-payroll-test.mjs` (xóa sau khi chạy)

- [ ] **Step 1: Viết hàm thuần**

```js
// Tính lương giáo viên theo tháng — hàm THUẦN (không gọi supabase).
// Công thức (spec 2026-06-22):
//   rate (đơn giá/buổi) = monthlySalary / scheduled  (scheduled>0 else 0)
//   actualPay = rate * (taught + subs)
//   taught = scheduled - absent ; subs = số buổi GV dạy thay cho người khác.

// Số lần một thứ (0=CN..6=T7) xuất hiện trong tháng year/month(1-12).
export function countWeekdayOccurrences(year, month, dayOfWeek) {
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === dayOfWeek) count++
  }
  return count
}

// teachers: [{ id, name, email, monthlySalary }]
// classes:  [{ id, teacherId }]
// schedule: [{ id, classId, dayOfWeek }]
// attendance: [{ scheduleId, teacherId, status, substituteTeacherId }] (đã lọc theo tháng)
// Trả: [{ teacherId, name, base, scheduled, absent, taught, subs, rate, actualPay }]
export function buildPayrollRows({ year, month, teachers, classes, schedule, attendance }) {
  const classTeacher = new Map(classes.map(c => [c.id, c.teacherId]))
  // scheduleId -> teacherId phụ trách (qua lớp)
  const scheduleTeacher = new Map(
    schedule.map(s => [s.id, classTeacher.get(s.classId) ?? null])
  )

  // scheduled theo giáo viên = tổng số lần xuất hiện trong tháng của các ca thuộc lớp họ dạy
  const scheduledByTeacher = new Map()
  for (const s of schedule) {
    const tid = scheduleTeacher.get(s.id)
    if (!tid) continue
    const occ = countWeekdayOccurrences(year, month, s.dayOfWeek)
    scheduledByTeacher.set(tid, (scheduledByTeacher.get(tid) ?? 0) + occ)
  }

  // absent theo giáo viên (record status='absent' của chính họ)
  const absentByTeacher = new Map()
  // subs theo giáo viên (record có substituteTeacherId = họ)
  const subsByTeacher = new Map()
  for (const a of attendance) {
    if (a.status === 'absent') {
      absentByTeacher.set(a.teacherId, (absentByTeacher.get(a.teacherId) ?? 0) + 1)
      if (a.substituteTeacherId) {
        subsByTeacher.set(a.substituteTeacherId, (subsByTeacher.get(a.substituteTeacherId) ?? 0) + 1)
      }
    }
  }

  return teachers.map(t => {
    const base = t.monthlySalary ?? 0
    const scheduled = scheduledByTeacher.get(t.id) ?? 0
    const absent = absentByTeacher.get(t.id) ?? 0
    const taught = Math.max(0, scheduled - absent)
    const subs = subsByTeacher.get(t.id) ?? 0
    const rate = scheduled > 0 ? base / scheduled : 0
    const actualPay = Math.round(rate * (taught + subs))
    return {
      teacherId: t.id,
      name: t.name || t.email || '—',
      base,
      scheduled,
      absent,
      taught,
      subs,
      rate: Math.round(rate),
      actualPay,
    }
  })
}
```

- [ ] **Step 2: Viết script kiểm thử tạm**

Tạo `tmp-payroll-test.mjs` ở gốc repo:

```js
import { buildPayrollRows, countWeekdayOccurrences } from './src/utils/payroll.js'
import assert from 'node:assert'

// Tháng 6/2026: đếm số Thứ 2 (dayOfWeek=1). 1/6/2026 là Thứ Hai → 1,8,15,22,29 = 5.
assert.strictEqual(countWeekdayOccurrences(2026, 6, 1), 5, 'T2 in 6/2026 = 5')

const teachers = [
  { id: 'A', name: 'GV A', monthlySalary: 10_000_000 },
  { id: 'B', name: 'GV B', monthlySalary: 5_000_000 },
]
const classes = [
  { id: 'c1', teacherId: 'A' }, // A dạy
  { id: 'c2', teacherId: 'B' }, // B dạy
]
// Mỗi lớp 1 ca vào Thứ 2 → 5 buổi/tháng mỗi GV.
const schedule = [
  { id: 's1', classId: 'c1', dayOfWeek: 1 },
  { id: 's2', classId: 'c2', dayOfWeek: 1 },
]
// A vắng 1 buổi, B dạy thay buổi đó.
const attendance = [
  { scheduleId: 's1', teacherId: 'A', status: 'absent', substituteTeacherId: 'B' },
]

const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance })
const a = rows.find(r => r.teacherId === 'A')
const b = rows.find(r => r.teacherId === 'B')

// A: scheduled 5, rate 2,000,000, taught 4 → 8,000,000
assert.strictEqual(a.scheduled, 5)
assert.strictEqual(a.rate, 2_000_000)
assert.strictEqual(a.taught, 4)
assert.strictEqual(a.actualPay, 8_000_000)

// B: scheduled 5, rate 1,000,000, taught 5, subs 1 → 6 * 1,000,000 = 6,000,000
assert.strictEqual(b.scheduled, 5)
assert.strictEqual(b.rate, 1_000_000)
assert.strictEqual(b.subs, 1)
assert.strictEqual(b.actualPay, 6_000_000)

console.log('payroll OK')
```

- [ ] **Step 3: Chạy test, kỳ vọng PASS**

Run: `node tmp-payroll-test.mjs`
Expected: in `payroll OK`, không có AssertionError.

- [ ] **Step 4: Xóa script tạm**

Run: `rm tmp-payroll-test.mjs`

- [ ] **Step 5: Commit**

```bash
git add src/utils/payroll.js
git commit -m "feat(payroll): pure salary calc (rate, taught, subs)"
```

---

## Task 5: usePermissions — cờ `canViewAllPayroll`

**Files:**
- Modify: `src/hooks/usePermissions.js`

- [ ] **Step 1: Thêm cờ**

Thêm dòng vào object trả về (sau `canCheckTeacherAttendance: isAdmin,`):

```js
    canViewAllPayroll: isAdmin,
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePermissions.js
git commit -m "feat(perms): canViewAllPayroll flag"
```

---

## Task 6: AdminPanelPage — ô nhập lương tháng

**Files:**
- Modify: `src/pages/AdminPanelPage.jsx`

- [ ] **Step 1: Thêm import helper tiền tệ + icon**

Dòng 9 hiện import từ `lucide-react`. Thêm `Wallet` vào danh sách icon:

```js
import { Plus, Users, GraduationCap, UserCog, AlertCircle, ChevronRight, ShieldCheck, ShieldOff, Wallet } from 'lucide-react'
```

Thêm import helper ngay dưới dòng `import clsx from 'clsx'` (dòng 10):

```js
import { fmtVND } from '@/utils/helpers'
```

- [ ] **Step 2: State nhập lương + handler lưu**

Thêm sau dòng `const [confirmAdmin, setConfirmAdmin] = useState({ open: false, teacher: null })` (dòng 26):

```js
  const [salaryDraft, setSalaryDraft] = useState({})   // { [teacherId]: '12000000' }
  const [savingSalaryId, setSavingSalaryId] = useState(null)
```

Thêm handler sau `doToggleAdmin` (sau dòng 123):

```js
  const handleSaveSalary = async (t) => {
    const raw = salaryDraft[t.id]
    const value = raw === '' || raw == null ? null : Number(raw)
    if (value != null && (Number.isNaN(value) || value < 0)) {
      toast.error('Lương không hợp lệ')
      return
    }
    setSavingSalaryId(t.id)
    try {
      await teacherService.update(t.id, { monthlySalary: value })
      toast.success('Đã lưu lương tháng')
      setSalaryDraft(d => { const n = { ...d }; delete n[t.id]; return n })
      loadTeachers()
    } catch (err) {
      toast.error('Lỗi lưu lương: ' + err.message)
    } finally {
      setSavingSalaryId(null)
    }
  }
```

- [ ] **Step 3: Render ô lương trong mỗi card giáo viên**

Trong vòng lặp `teachers.map(t => {...})`, ngay TRƯỚC khối `{/* Admin toggle button */}` (trước dòng 263 `{!isSelf && (`), chèn:

```jsx
                    {/* Lương tháng */}
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <Wallet size={13} className="text-navy-400 shrink-0" />
                      <input
                        type="number"
                        min="0"
                        step="100000"
                        value={salaryDraft[t.id] ?? (t.monthlySalary ?? '')}
                        onChange={e => setSalaryDraft(d => ({ ...d, [t.id]: e.target.value }))}
                        placeholder="Lương tháng"
                        className="input text-xs py-1 flex-1 min-w-0"
                      />
                      <button
                        onClick={() => handleSaveSalary(t)}
                        disabled={savingSalaryId === t.id || salaryDraft[t.id] === undefined}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-navy-50 text-navy-700 hover:bg-navy-100 transition-colors disabled:opacity-40"
                      >
                        {savingSalaryId === t.id ? '...' : 'Lưu'}
                      </button>
                    </div>
                    {t.monthlySalary != null && (
                      <p className="px-4 -mt-2 pb-2 text-xs text-navy-400">
                        Hiện tại: {fmtVND(t.monthlySalary)}
                      </p>
                    )}
```

> `input`/`select` classes (`.input`, `.select`) đã định nghĩa trong `src/index.css` và dùng khắp project.

- [ ] **Step 4: Verify build + kiểm thử thủ công**

Run: `npm run build`
Expected: build thành công.
Thủ công (admin): mở Admin Panel → mỗi giáo viên có ô "Lương tháng" → nhập số → "Lưu" → toast thành công → dòng "Hiện tại: …đ" cập nhật.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AdminPanelPage.jsx
git commit -m "feat(admin): nhập lương tháng cho giáo viên"
```

---

## Task 7: ScheduleCard — dropdown "Dạy thay" khi Vắng

**Files:**
- Modify: `src/components/schedule/ScheduleCard.jsx`

- [ ] **Step 1: Mở rộng props**

Thay dòng chữ ký component (dòng 19):

```jsx
export const ScheduleCard = ({ item, cls, studentCount, showTeacher, onEdit, canCheckAttendance = false, attendanceRecord = null, onToggleAttendance, onAttendanceNote, teachers = [], onSetSubstitute }) => {
```

- [ ] **Step 2: Render dropdown dạy thay + nhãn**

Thay khối "Note input — chỉ hiện khi Vắng" (dòng 97-107) bằng:

```jsx
      {/* Khi Vắng: chọn người dạy thay + ghi chú */}
      {canCheckAttendance && isAbsent && (
        <div className="mt-1.5 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
          <select
            value={attendanceRecord?.substituteTeacherId ?? ''}
            onChange={(e) => onSetSubstitute?.(item, e.target.value || null)}
            className="w-full text-xs px-2 py-1 rounded-lg border border-red-200 bg-white text-navy-700 focus:outline-none focus:ring-1 focus:ring-red-300"
          >
            <option value="">— Không có người dạy thay —</option>
            {teachers
              .filter(t => t.id !== cls?.teacherId)
              .map(t => (
                <option key={t.id} value={t.id}>Dạy thay: {t.name || t.email}</option>
              ))}
          </select>
          <input
            type="text"
            value={noteVal}
            onChange={(e) => handleNote(e.target.value)}
            placeholder="Ghi chú"
            className="w-full text-xs px-2 py-1 rounded-lg border border-red-200 bg-white text-navy-700 placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-red-300"
          />
        </div>
      )}
```

> Đã gỡ `onClick stopPropagation` lẻ trên input cũ vì cả khối bọc đã `stopPropagation`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 4: Commit**

```bash
git add src/components/schedule/ScheduleCard.jsx
git commit -m "feat(schedule): dropdown chọn người dạy thay khi vắng"
```

---

## Task 8: WeeklyGrid — truyền `teachers` + `onSetSubstitute`

**Files:**
- Modify: `src/components/schedule/WeeklyGrid.jsx`

- [ ] **Step 1: Mở rộng props của WeeklyGrid**

Thay dòng chữ ký (dòng 28):

```jsx
export const WeeklyGrid = ({ scheduleItems = [], classes = [], studentCounts = new Map(), showTeacher = false, onEdit, onAddDay, weekStart = null, canCheckAttendance = false, attendanceMap = new Map(), onToggleAttendance, onAttendanceNote, teachers = [], onSetSubstitute }) => {
```

- [ ] **Step 2: Truyền xuống cả 2 chỗ render `ScheduleCard` (desktop + mobile)**

Trong CẢ HAI block `ScheduleCard` (desktop ~dòng 74-85 và mobile ~dòng 115-126), thêm 2 prop ngay sau `onAttendanceNote=...`:

```jsx
                      teachers={teachers}
                      onSetSubstitute={(it, teacherId) => onSetSubstitute?.(it, date, teacherId)}
```

(Cả hai chỗ đều có biến `date` trong scope.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 4: Commit**

```bash
git add src/components/schedule/WeeklyGrid.jsx
git commit -m "feat(schedule): WeeklyGrid forward teachers + onSetSubstitute"
```

---

## Task 9: SchedulePage — đổi tên "Giảng Dạy", 2 tab, handler dạy thay

**Files:**
- Modify: `src/pages/SchedulePage.jsx`

- [ ] **Step 1: Import thêm + cờ quyền + PayrollTab**

Thay dòng 13 (`import { usePermissions }`) — thêm `canViewAllPayroll`:

```js
import { usePermissions } from '@/hooks/usePermissions'
import { PayrollTab } from '@/components/schedule/PayrollTab'
```

Thay dòng 45:

```js
  const { canFilterByTeacher: isAdmin, canCheckTeacherAttendance, canViewAllPayroll } = usePermissions()
```

- [ ] **Step 2: State tab**

Thêm sau dòng 48 (`const [weekStart, ...]`):

```js
  const [activeTab, setActiveTab] = useState('schedule')   // 'schedule' | 'payroll'
```

- [ ] **Step 3: Handler set người dạy thay**

Thêm sau `handleSetAttendanceNote` (sau dòng 220):

```js
  // Chọn / bỏ người dạy thay cho một buổi vắng.
  const handleSetSubstitute = useCallback(async (item, date, substituteTeacherId) => {
    const cls = classes.find(c => c.id === item.classId)
    if (!cls?.teacherId) return
    const record = attendanceMap.get(`${item.id}_${date}`)
    try {
      await teacherAttendanceService.upsert({
        scheduleId: item.id,
        date,
        teacherId: cls.teacherId,
        status: record?.status ?? 'absent',
        note: record?.note ?? null,
        substituteTeacherId,
      })
      await loadAttendance()
    } catch {
      toast.error('Không thể lưu người dạy thay')
    }
  }, [classes, attendanceMap, loadAttendance])
```

- [ ] **Step 4: Khi toggle về "Đã dạy" thì xóa người dạy thay**

Trong `handleToggleAttendance` (dòng 185-202), bổ sung `substituteTeacherId` vào lời gọi upsert — khi chuyển sang `present` thì xóa người dạy thay:

```js
      await teacherAttendanceService.upsert({
        scheduleId: item.id,
        date,
        teacherId: cls.teacherId,
        status: nextStatus,
        note: record?.note ?? null,
        substituteTeacherId: nextStatus === 'absent' ? (record?.substituteTeacherId ?? null) : null,
      })
```

- [ ] **Step 5: Đổi tiêu đề trang + thêm thanh tab**

Thay khối Page Header (dòng 240-254). Tiêu đề "Lịch Dạy" → "Giảng Dạy", và nút "Xếp Lịch" chỉ hiện ở tab schedule:

```jsx
      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Giảng Dạy</h1>
          <p className="text-sm text-navy-400 mt-0.5">Thời khóa biểu, chấm công và lương giáo viên</p>
        </div>
        {activeTab === 'schedule' && (
          <Button
            variant="primary"
            size="md"
            onClick={() => openAdd(null)}
            className="flex items-center gap-2 shrink-0"
          >
            <Plus size={16} />
            Xếp Lịch
          </Button>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-navy-100">
        <button
          onClick={() => setActiveTab('schedule')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'schedule'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-navy-400 hover:text-navy-700'
          )}
        >
          Lịch Dạy
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'payroll'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-navy-400 hover:text-navy-700'
          )}
        >
          Bảng Lương
        </button>
      </div>
```

- [ ] **Step 6: Bọc nội dung lịch hiện tại trong tab + render PayrollTab**

Toàn bộ khối từ `{/* ── Week navigation ... */}` (dòng 256) đến hết khối lưới (dòng 396, ngay trước `{/* ── Modal ── */}`) phải chỉ hiện khi `activeTab === 'schedule'`. Bọc bằng:

```jsx
      {activeTab === 'schedule' && (
        <>
          {/* ...toàn bộ: week navigation + thanh Hôm nay + lưới WeeklyGrid... */}
        </>
      )}

      {activeTab === 'payroll' && (
        <PayrollTab
          classes={classes}
          schedule={schedule}
          teachers={teachers}
          isAdmin={canViewAllPayroll}
        />
      )}
```

> `classes`/`schedule` đã load sẵn ở `loadData`. `teachers` chỉ load khi `isAdmin` — với giáo viên thường, PayrollTab tự xử lý (Step trong Task 10 dùng `useAuth` để lấy chính mình khi không phải admin).

- [ ] **Step 7: Truyền props dạy thay xuống WeeklyGrid**

Trong phần render `<WeeklyGrid ... />` (dòng 380-392), thêm 2 prop:

```jsx
                teachers={teachers}
                onSetSubstitute={handleSetSubstitute}
```

> `teachers` rỗng với giáo viên thường (không load) → dropdown dạy thay trống, nhưng giáo viên thường không thấy chip chấm công (`canCheckTeacherAttendance=false`) nên không ảnh hưởng.

- [ ] **Step 8: Verify build + kiểm thử thủ công**

Run: `npm run build`
Expected: build thành công.
Thủ công (admin): trang "Giảng Dạy" có 2 tab. Tab Lịch Dạy → đánh dấu 1 buổi Vắng → hiện dropdown "Dạy thay" + ô ghi chú → chọn GV khác → reload vẫn giữ. Toggle về "Đã dạy" → dropdown biến mất, người dạy thay bị xóa.

- [ ] **Step 9: Commit**

```bash
git add src/pages/SchedulePage.jsx
git commit -m "feat(schedule): trang Giảng Dạy 2 tab + handler dạy thay"
```

---

## Task 10: PayrollTab — bảng lương theo tháng + export

**Files:**
- Create: `src/components/schedule/PayrollTab.jsx`

- [ ] **Step 1: Viết component**

```jsx
import { useState, useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { Empty } from '@/components/ui'
import { ExportExcelButton } from '@/components/reports/ExportExcelButton'
import { useAuth } from '@/hooks/useAuth'
import { buildPayrollRows } from '@/utils/payroll'
import { teacherAttendanceService } from '@/services/teacherAttendanceService'
import { teacherService } from '@/services/classService'
import { fmtVND } from '@/utils/helpers'
import { useEffect } from 'react'

const currentMonthValue = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// classes/schedule truyền từ SchedulePage (đã load). teachers chỉ có khi admin.
export const PayrollTab = ({ classes = [], schedule = [], teachers = [], isAdmin = false }) => {
  const { teacher } = useAuth()
  const [monthStr, setMonthStr] = useState(currentMonthValue())
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const [year, month] = useMemo(() => monthStr.split('-').map(Number), [monthStr])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    teacherAttendanceService.getByMonth(year, month)
      .then(rows => { if (active) setAttendance(rows) })
      .catch(() => { if (active) setError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [year, month])

  // Danh sách giáo viên dùng để tính: admin = tất cả; GV thường = chính mình.
  const [selfTeacher, setSelfTeacher] = useState(null)
  useEffect(() => {
    if (isAdmin) return
    // GV thường: dùng profile từ useAuth (có monthly_salary qua select('*')).
    if (teacher) {
      setSelfTeacher({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        monthlySalary: teacher.monthly_salary ?? null,
      })
    }
  }, [isAdmin, teacher])

  const payrollTeachers = isAdmin ? teachers : (selfTeacher ? [selfTeacher] : [])

  const rows = useMemo(() => {
    if (payrollTeachers.length === 0) return []
    return buildPayrollRows({ year, month, teachers: payrollTeachers, classes, schedule, attendance })
  }, [year, month, payrollTeachers, classes, schedule, attendance])

  const excelColumns = [
    { key: 'name', label: 'Giáo viên' },
    { key: 'baseFmt', label: 'Lương tháng' },
    { key: 'scheduled', label: 'Buổi theo lịch' },
    { key: 'taught', label: 'Đã dạy' },
    { key: 'absent', label: 'Vắng' },
    { key: 'subs', label: 'Dạy thay' },
    { key: 'rateFmt', label: 'Đơn giá/buổi' },
    { key: 'payFmt', label: 'Thực nhận' },
  ]
  const excelRows = rows.map(r => ({
    ...r,
    baseFmt: fmtVND(r.base),
    rateFmt: fmtVND(r.rate),
    payFmt: fmtVND(r.actualPay),
  }))

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold text-navy-800 text-base flex items-center gap-2">
          <Wallet size={16} /> Bảng Lương theo tháng
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="input text-xs py-1 w-36"
            value={monthStr}
            onChange={e => setMonthStr(e.target.value)}
          />
          <ExportExcelButton
            rows={excelRows}
            columns={excelColumns}
            filename="bang-luong-giao-vien"
            disabled={rows.length === 0}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-navy-400 py-8 text-center">Đang tải...</p>
      ) : error ? (
        <p className="text-sm text-red-500 py-8 text-center">Không thể tải dữ liệu chấm công</p>
      ) : rows.length === 0 ? (
        <Empty icon={<Wallet size={40} />} title="Chưa có dữ liệu lương" desc="Chưa có giáo viên hoặc lịch dạy để tính lương." />
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-navy-100">
                <th className="py-2 pr-3 font-medium text-navy-600">Giáo viên</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-right">Lương tháng</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-center">Buổi/lịch</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-center">Đã dạy</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-center">Vắng</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-center">Dạy thay</th>
                <th className="py-2 pr-3 font-medium text-navy-600 text-right">Đơn giá/buổi</th>
                <th className="py-2 font-medium text-navy-600 text-right">Thực nhận</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.teacherId} className="border-b border-navy-50">
                  <td className="py-1.5 pr-3 text-navy-800 font-medium">
                    {r.name}
                    {r.base === 0 && (
                      <span className="ml-1.5 text-xs text-amber-600">(chưa đặt lương)</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-navy-700 text-right">{fmtVND(r.base)}</td>
                  <td className="py-1.5 pr-3 text-navy-700 text-center">{r.scheduled}</td>
                  <td className="py-1.5 pr-3 text-green-600 text-center">{r.taught}</td>
                  <td className="py-1.5 pr-3 text-red-500 text-center">{r.absent}</td>
                  <td className="py-1.5 pr-3 text-navy-700 text-center">{r.subs}</td>
                  <td className="py-1.5 pr-3 text-navy-500 text-right">{fmtVND(r.rate)}</td>
                  <td className="py-1.5 text-navy-900 font-semibold text-right">{fmtVND(r.actualPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

> Import `Empty` từ `@/components/ui` (đã export). `useEffect` gộp vào import dòng đầu — gộp lại thành `import { useState, useMemo, useEffect } from 'react'` (tránh import trùng).

- [ ] **Step 2: Gộp import react cho gọn**

Sửa 2 dòng import react ở đầu file thành một dòng:

```jsx
import { useState, useMemo, useEffect } from 'react'
```

(xóa dòng `import { useEffect } from 'react'` ở giữa file)

- [ ] **Step 3: Verify build + kiểm thử thủ công**

Run: `npm run build`
Expected: build thành công.
Thủ công (admin): tab Bảng Lương → chọn tháng → bảng liệt kê mọi giáo viên với Buổi/lịch, Đã dạy, Vắng, Dạy thay, Đơn giá, Thực nhận. Đánh dấu vắng + dạy thay ở tab Lịch Dạy rồi quay lại → số Vắng/Dạy thay/Thực nhận đổi đúng. Export Excel ra file.
Thủ công (GV thường): tab Bảng Lương chỉ hiện 1 dòng của chính mình.

- [ ] **Step 4: Commit**

```bash
git add src/components/schedule/PayrollTab.jsx
git commit -m "feat(payroll): tab Bảng Lương theo tháng + export Excel"
```

---

## Task 11: Navbar — đổi label "Giảng Dạy"

**Files:**
- Modify: `src/components/layout/Navbar.jsx:20`

- [ ] **Step 1: Đổi label**

Thay dòng 20:

```js
  { id: 'schedule', label: 'Giảng Dạy', icon: Calendar },
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build thành công; Navbar hiển thị "Giảng Dạy".

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Navbar.jsx
git commit -m "feat(nav): đổi tên mục lịch thành Giảng Dạy"
```

---

## Task 12: Đồng bộ tài liệu + seed (BẮT BUỘC theo CLAUDE.md)

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `supabase/seed/seed_mock_data.sql`

- [ ] **Step 1: Cập nhật CLAUDE.md**

Trong CLAUDE.md, cập nhật/bổ sung (giữ văn phong tiếng Việt sẵn có):
- Mục "Chấm công giáo viên": đổi tên trang thành **"Giảng Dạy"** (route `schedule`) có 2 tab **Lịch Dạy** + **Bảng Lương**.
- Thêm mô tả **mô hình lương**: `teachers.monthly_salary` (lương tháng cố định); đơn giá buổi = lương / số buổi theo lịch trong tháng; lương thực nhận = đơn giá × (đã dạy + dạy thay).
- Thêm **dạy thay**: `teacher_attendance.substitute_teacher_id`; khi vắng admin chọn người dạy thay → công buổi đó tính cho người dạy thay theo **đơn giá của chính họ**; người vắng mất công buổi đó.
- Migration mới `20260622000001_add_teacher_salary_and_substitute.sql` (cột + mở rộng policy SELECT `teacher_attendance` cho `substitute_teacher_id = auth.uid()`).
- `usePermissions` thêm cờ `canViewAllPayroll`.
- Logic lương ở `src/utils/payroll.js` (hàm thuần `buildPayrollRows`); UI ở `src/components/schedule/PayrollTab.jsx`.
- `teacherService.update` nhận `{ name, monthlySalary }`; `getAll` trả `monthlySalary`.
- `teacherAttendanceService` thêm `substituteTeacherId` + `getByMonth`.

- [ ] **Step 2: Cập nhật README.md**

Thêm mục tính năng "Lương giáo viên & dạy thay" mô tả ngắn cho người dùng cuối: admin đặt lương tháng trong Admin Panel; chấm công + chọn người dạy thay ở tab Lịch Dạy; xem lương ở tab Bảng Lương (admin xem tất cả, giáo viên xem của mình).

- [ ] **Step 3: Cập nhật seed**

Trong `supabase/seed/seed_mock_data.sql`:
- Set `monthly_salary` mẫu cho các teacher mock (vd 10–12 triệu) ở phần cập nhật/insert teachers.
- (Tùy chọn) thêm 1–2 record `teacher_attendance` `status='absent'` có `substitute_teacher_id` trỏ teacher mock khác, để tab Bảng Lương có dữ liệu dạy thay khi demo.
- Đảm bảo idempotent (cleanup theo teacher mock như phần còn lại của file).

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build thành công (tài liệu/seed không ảnh hưởng build, nhưng chạy để chắc chắn không sửa nhầm file code).

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md README.md supabase/seed/seed_mock_data.sql
git commit -m "docs: cập nhật CLAUDE.md/README + seed cho lương giáo viên & dạy thay"
```

---

## Self-Review (đã thực hiện khi viết plan)

- **Spec coverage:**
  - §3 migration (salary, substitute, RLS) → Task 1.
  - §4 service (teacherService, teacherAttendanceService, payroll util, useAuth) → Task 2, 3, 4 (useAuth không cần sửa vì `select('*')`).
  - §5.1 nhập lương admin → Task 6.
  - §5.2 đổi tên + 2 tab → Task 9, 11.
  - §5.3 UX dạy thay → Task 7, 8, 9.
  - §5.4 bảng lương + export → Task 10.
  - §5.5 + §6 quyền/RLS → Task 1 (RLS), 5 (cờ), 9/10 (lọc theo quyền).
  - §6 cập nhật tài liệu → Task 12.
- **Type/tên nhất quán:** `monthlySalary` (camelCase) ở service/UI ⇄ `monthly_salary` (DB). `substituteTeacherId` ⇄ `substitute_teacher_id`. `buildPayrollRows` field names (`base/scheduled/absent/taught/subs/rate/actualPay`) khớp giữa util (Task 4) và PayrollTab (Task 10).
- **Không placeholder:** mọi step có code/lệnh cụ thể.
- **Lưu ý quan trọng:** Task 3 đổi shape trả về của `teacherService.getAll` (thêm `monthlySalary`) nhưng GIỮ `id/name/email/is_admin` để các caller hiện tại không vỡ — đã ghi rõ.
