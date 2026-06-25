# Quản lý GV, chấm công opt-in & dạy thay xác nhận — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển chấm công giáo viên sang mô hình opt-in (GV tự xác nhận đã dạy), thêm dạy thay có xác nhận, hiển thị lịch dạy theo GV trong Admin Panel, và cập nhật công thức lương tương ứng.

**Architecture:** Mở rộng bảng `teacher_attendance` (thêm `substitute_confirmed` + RLS cho GV tự ghi), cập nhật service layer và hàm thuần `buildPayrollRows`, rồi sửa UI (ScheduleCard 3 trạng thái, section "dạy thay được giao", Admin Panel inline expand). Tách cờ phân quyền chấm công.

**Tech Stack:** React 18 + Vite, Tailwind (navy tokens), Supabase (Postgres + RLS), `@/` alias. **Không có test runner** — kiểm chứng logic thuần bằng node script tạm trong scratchpad; kiểm thử UI thủ công qua `npm run dev` + xác nhận `npm run build` không lỗi.

**Quy ước chung:**
- Đọc/ghi data qua service layer (không gọi `supabase.*` trong component, trừ auth).
- Dùng navy tokens, không hex; component từ `@/components/ui`.
- Tiền: `fmtVND` (đã có). Thứ: `0=CN…6=T7`.
- Scratchpad cho file tạm: `C:\Users\PC\AppData\Local\Temp\claude\c--Users-PC-Desktop-Ielts-Web\9be1eab3-eb42-4df5-9768-5377f9df84b1\scratchpad`

---

## Thứ tự task (theo phụ thuộc)

1. Migration DB + RLS
2. Service: `teacherAttendanceService` (map + method mới)
3. Logic lương: `payroll.js`
4. Phân quyền: `usePermissions`
5. Trạng thái hiển thị: `attendanceStatus.js`
6. UI chip 3 trạng thái: `ScheduleCard`
7. SchedulePage: cycle + load cho GV + section dạy thay
8. Helper format thứ + Admin Panel inline expand
9. PayrollTab: cột "Chưa xác nhận"
10. Seed + tài liệu (CLAUDE.md, README)

---

### Task 1: Migration — `substitute_confirmed` + RLS cho GV tự chấm công

**Files:**
- Create: `supabase/migrations/20260625000001_teacher_attendance_optin_substitute_confirm.sql`

- [ ] **Step 1: Viết migration**

```sql
-- =========================================================================
-- Migration: Chấm công opt-in + xác nhận dạy thay
-- Change: teacher-attendance-optin-substitute-confirm
--
-- - teacher_attendance.substitute_confirmed: GV dạy thay xác nhận đã dạy.
-- - RLS: cho phép GV tự chấm công (insert/update/delete) record của lớp mình
--   phụ trách; cho phép GV dạy thay update record được giao.
-- - Mô hình opt-in: KHÔNG có record = "chưa xác nhận" (không tính lương);
--   status='present' = đã dạy (tính lương); status='absent' = vắng.
--
-- Rollback:
--   drop policy if exists "teacher_attendance: teacher self insert" on public.teacher_attendance;
--   drop policy if exists "teacher_attendance: teacher self update" on public.teacher_attendance;
--   drop policy if exists "teacher_attendance: teacher self delete" on public.teacher_attendance;
--   drop policy if exists "teacher_attendance: substitute confirm update" on public.teacher_attendance;
--   alter table public.teacher_attendance drop column if exists substitute_confirmed;
-- =========================================================================

alter table public.teacher_attendance
  add column if not exists substitute_confirmed boolean not null default false;

-- GV tự chấm công cho buổi thuộc lớp mình phụ trách.
create policy "teacher_attendance: teacher self insert"
  on public.teacher_attendance for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.schedule s
      join public.classes c on c.id = s.class_id
      where s.id = schedule_id and c.teacher_id = auth.uid()
    )
  );

create policy "teacher_attendance: teacher self update"
  on public.teacher_attendance for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "teacher_attendance: teacher self delete"
  on public.teacher_attendance for delete
  using (teacher_id = auth.uid());

-- GV dạy thay cập nhật record được giao (giữ vai trò substitute của chính mình).
create policy "teacher_attendance: substitute confirm update"
  on public.teacher_attendance for update
  using (substitute_teacher_id = auth.uid())
  with check (substitute_teacher_id = auth.uid());
```

- [ ] **Step 2: Xác minh tên bảng/cột khớp schema hiện tại**

Đọc `supabase/migrations/20260620000001_create_teacher_attendance.sql` và `20260101000001_create_teachers.sql` để chắc bảng `schedule` có cột `class_id`, `classes` có `teacher_id`. (Đã xác nhận trong spec: `schedule.class_id`, `classes.teacher_id` tồn tại.)

Run: `grep -rn "class_id" supabase/migrations/` — kỳ vọng thấy cột `class_id` trên bảng `schedule`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260625000001_teacher_attendance_optin_substitute_confirm.sql
git commit -m "feat(db): chấm công opt-in + RLS GV tự chấm & xác nhận dạy thay"
```

> **Lưu ý áp dụng:** migration này cần chạy trên Supabase (SQL Editor hoặc CLI). Nhắc user áp dụng trước khi test UI phần ghi dữ liệu của GV thường.

---

### Task 2: Service — map `substituteConfirmed` + method dạy thay

**Files:**
- Modify: `src/services/teacherAttendanceService.js`

- [ ] **Step 1: Thêm `substituteConfirmed` vào `fromDB`/`toDB`**

Trong `fromDB`, thêm sau dòng `substituteTeacherId`:
```js
  substituteConfirmed: row.substitute_confirmed ?? false,
```
Trong `toDB`, thêm:
```js
  substitute_confirmed: data.substituteConfirmed ?? false,
```

- [ ] **Step 2: Đảm bảo `upsert` truyền `substituteConfirmed`**

Cập nhật chữ ký `upsert` để nhận thêm `substituteConfirmed` và đưa vào `toDB`:
```js
  async upsert({ scheduleId, date, teacherId, status, note, substituteTeacherId, substituteConfirmed }) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .upsert(toDB({ scheduleId, date, teacherId, status, note, substituteTeacherId, substituteConfirmed }), {
        onConflict: 'schedule_id,date',
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },
```

- [ ] **Step 3: Thêm method `getSubstituteAssignments` (buổi GV hiện tại được giao dạy thay trong tuần)**

Thêm vào object service. Lấy record `status='absent'` có `substitute_teacher_id = uid` trong khoảng tuần, kèm join lịch + lớp + tên GV chính. RLS SELECT đã cho phép substitute đọc record; join `schedule`/`classes`/`teachers` đọc qua quan hệ.

```js
  // Buổi GV hiện tại (auth.uid) được giao dạy thay trong khoảng ngày.
  // Trả [{ id, scheduleId, date, substituteConfirmed, classId, className, room,
  //        startTime, endTime, mainTeacherName }]
  async getSubstituteAssignments(dateFrom, dateTo) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('teacher_attendance')
      .select(`
        id, schedule_id, date, substitute_confirmed,
        schedule:schedule_id (
          class_id, start_time, end_time, room,
          class:class_id ( name )
        ),
        mainTeacher:teacher_id ( name )
      `)
      .eq('substitute_teacher_id', user.id)
      .eq('status', 'absent')
      .gte('date', dateFrom)
      .lte('date', dateTo)
    if (error) throw new Error(error.message)
    return (data ?? []).map(r => ({
      id: r.id,
      scheduleId: r.schedule_id,
      date: r.date,
      substituteConfirmed: r.substitute_confirmed ?? false,
      classId: r.schedule?.class_id ?? null,
      className: r.schedule?.class?.name ?? '—',
      room: r.schedule?.room ?? null,
      startTime: r.schedule?.start_time ?? null,
      endTime: r.schedule?.end_time ?? null,
      mainTeacherName: r.mainTeacher?.name ?? '—',
    }))
  },
```

> **Nếu join bị RLS chặn** (GV thường không SELECT được `classes`/`schedule` của lớp người khác): tại bước test (Step 5) nếu `className`/`startTime` trả null hết, chuyển sang phương án denormalize — báo lại để bổ sung task nới RLS SELECT `schedule`/`classes` cho substitute, HOẶC lưu snapshot khi admin gán. Không tự ý đổi schema ngoài plan; báo trước.

- [ ] **Step 4: Thêm method `confirmSubstitute` (set cờ, không ghi đè field khác)**

`upsert` ghi đè toàn record nên không dùng cho confirm. Dùng `update` theo `(schedule_id, date)`:
```js
  // GV dạy thay xác nhận đã dạy — chỉ set substitute_confirmed.
  async confirmSubstitute(scheduleId, date, confirmed = true) {
    const { data, error } = await supabase
      .from('teacher_attendance')
      .update({ substitute_confirmed: confirmed })
      .eq('schedule_id', scheduleId)
      .eq('date', date)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(data)
  },
```

- [ ] **Step 5: Kiểm chứng build + đọc lại file**

Run: `npm run build`
Expected: build thành công, không lỗi import/cú pháp.

(Kiểm thử dữ liệu thực hiện ở Task 7 khi UI dạy thay sẵn sàng.)

- [ ] **Step 6: Commit**

```bash
git add src/services/teacherAttendanceService.js
git commit -m "feat(service): map substituteConfirmed + getSubstituteAssignments/confirmSubstitute"
```

---

### Task 3: Logic lương — `payroll.js` theo mô hình opt-in

**Files:**
- Modify: `src/utils/payroll.js`
- Test (tạm): `scratchpad/payroll-check.mjs`

- [ ] **Step 1: Viết script kiểm chứng (thay cho unit test)**

Tạo `<scratchpad>/payroll-check.mjs` (copy hàm sau khi sửa vào để chạy độc lập, hoặc import bằng đường dẫn tương đối). Nội dung kiểm chứng các trường hợp:

```js
// Chạy: node payroll-check.mjs
import { buildPayrollRows } from 'file:///c:/Users/PC/Desktop/Ielts/Web/src/utils/payroll.js'

const year = 2026, month = 6
const teachers = [{ id: 'T1', name: 'A', monthlySalary: 8000000 }, { id: 'T2', name: 'B', monthlySalary: 6000000 }]
const classes = [{ id: 'C1', teacherId: 'T1' }]
// 1 ca thứ 4 (dayOfWeek=3). Tháng 6/2026 có một số thứ 4.
const schedule = [{ id: 'S1', classId: 'C1', dayOfWeek: 3 }]
// T1 xác nhận 'present' 2 buổi, vắng 1 buổi (có T2 dạy thay đã confirm)
const attendance = [
  { scheduleId: 'S1', teacherId: 'T1', date: '2026-06-03', status: 'present' },
  { scheduleId: 'S1', teacherId: 'T1', date: '2026-06-10', status: 'present' },
  { scheduleId: 'S1', teacherId: 'T1', date: '2026-06-17', status: 'absent', substituteTeacherId: 'T2', substituteConfirmed: true },
]
const rows = buildPayrollRows({ year, month, teachers, classes, schedule, attendance })
console.log(JSON.stringify(rows, null, 2))
// Kỳ vọng: T1.taught = 2 (chỉ đếm present), T1.absent = 1
//          T2.subs = 1 (substituteConfirmed=true)
//          T1.scheduled = số thứ 4 trong 6/2026 (mẫu số đơn giá không đổi)
```

- [ ] **Step 2: Chạy script TRƯỚC khi sửa để thấy kết quả cũ (taught = scheduled − absent)**

Run: `node "<scratchpad>/payroll-check.mjs"`
Expected: `taught` của T1 = `scheduled − 1` (logic cũ), `subs` của T2 = 1. Ghi nhận để so sánh.

- [ ] **Step 3: Sửa `buildPayrollRows` — `taught` đếm record present, `subs` đếm confirmed**

Thay khối tính `absentByTeacher`/`subsByTeacher` và `taught`:

```js
  // taught theo GV = số record status='present' của chính họ.
  const taughtByTeacher = new Map()
  const absentByTeacher = new Map()
  // subs theo GV = số record substituteTeacherId=họ VÀ đã xác nhận dạy thay.
  const subsByTeacher = new Map()
  for (const a of attendance) {
    if (a.status === 'present') {
      taughtByTeacher.set(a.teacherId, (taughtByTeacher.get(a.teacherId) ?? 0) + 1)
    }
    if (a.status === 'absent') {
      absentByTeacher.set(a.teacherId, (absentByTeacher.get(a.teacherId) ?? 0) + 1)
      if (a.substituteTeacherId && a.substituteConfirmed) {
        subsByTeacher.set(a.substituteTeacherId, (subsByTeacher.get(a.substituteTeacherId) ?? 0) + 1)
      }
    }
  }
```

Trong `teachers.map`, thay dòng `const taught = Math.max(0, scheduled - absent)` bằng:
```js
    const taught = taughtByTeacher.get(t.id) ?? 0
```
(Giữ `absent` cho hiển thị; `rate = base / scheduled`; `actualPay = round(rate * (taught + subs))`.)

Cập nhật comment đầu file cho khớp mô hình mới (taught = đếm present; subs = confirmed).

- [ ] **Step 4: Chạy lại script — xác minh kết quả mới**

Run: `node "<scratchpad>/payroll-check.mjs"`
Expected: `T1.taught = 2`, `T1.absent = 1`, `T2.subs = 1`, `T1.scheduled` = số thứ 4 trong 6/2026.

- [ ] **Step 5: Commit**

```bash
git add src/utils/payroll.js
git commit -m "feat(payroll): taught đếm buổi present, subs đếm dạy thay đã xác nhận"
```

---

### Task 4: Phân quyền — tách cờ chấm công

**Files:**
- Modify: `src/hooks/usePermissions.js`

- [ ] **Step 1: Thêm cờ mới, giữ tương thích**

Trong object return, thay/ bổ sung:
```js
    canCheckTeacherAttendance: isAdmin,   // (giữ tương thích — admin thao tác mọi GV)
    canCheckAllAttendance: isAdmin,        // admin: chấm/sửa mọi GV, gán dạy thay
    canCheckOwnAttendance: true,           // mọi GV: tự chấm lớp mình + xác nhận dạy thay
    canViewAllPayroll: isAdmin,
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: thành công.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePermissions.js
git commit -m "feat(perms): tách canCheckAllAttendance / canCheckOwnAttendance"
```

---

### Task 5: Trạng thái hiển thị "Chưa xác nhận"

**Files:**
- Modify: `src/components/schedule/attendanceStatus.js`

- [ ] **Step 1: Thêm trạng thái hiển thị `pending`**

Thêm vào mảng (trạng thái này chỉ để **hiển thị** khi không có record — không lưu DB):
```js
export const ATTENDANCE_STATUSES = [
  { value: 'pending', label: 'Chưa xác nhận', dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-300', bar: 'border-l-slate-300' },
  { value: 'present', label: 'Đã dạy', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', bar: 'border-l-green-500' },
  { value: 'absent',  label: 'Vắng',   dot: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'border-l-red-500'   },
]
```

- [ ] **Step 2: Build check + Commit**

```bash
npm run build
git add src/components/schedule/attendanceStatus.js
git commit -m "feat(schedule): thêm trạng thái hiển thị 'Chưa xác nhận'"
```

---

### Task 6: ScheduleCard — chip 3 trạng thái, mặc định "Chưa xác nhận"

**Files:**
- Modify: `src/components/schedule/ScheduleCard.jsx`

- [ ] **Step 1: Đổi logic trạng thái hiển thị**

Thay khối:
```js
  const isAbsent = attendanceRecord?.status === 'absent'
  const att = getAttendanceStatus(isAbsent ? 'absent' : 'present')
```
bằng:
```js
  // 3 trạng thái: không có record (hoặc status lạ) = 'pending'; 'present'; 'absent'.
  const status = attendanceRecord?.status === 'present' ? 'present'
    : attendanceRecord?.status === 'absent' ? 'absent'
    : 'pending'
  const isAbsent = status === 'absent'
  const att = getAttendanceStatus(status)
```

Phần `isAbsent && clsx('border-l-4', att.bar)` và chip giữ nguyên (dùng `att.*`). Chip title đổi: `title="Bấm để đổi: Chưa xác nhận → Đã dạy → Vắng"`.

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: thành công.

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule/ScheduleCard.jsx
git commit -m "feat(schedule): chip chấm công 3 trạng thái, mặc định Chưa xác nhận"
```

---

### Task 7: SchedulePage — cycle 3 trạng thái, load cho GV, section dạy thay

**Files:**
- Modify: `src/pages/SchedulePage.jsx`
- Create: `src/components/schedule/SubstituteAssignments.jsx`

- [ ] **Step 1: Đổi điều kiện load attendance để bao gồm GV thường**

Lấy thêm cờ từ `usePermissions`:
```js
  const { canFilterByTeacher: isAdmin, canCheckAllAttendance, canCheckOwnAttendance, canViewAllPayroll } = usePermissions()
```
Trong `loadAttendance`, đổi guard:
```js
    if (!canCheckOwnAttendance) { setAttendance([]); return }
```
và deps `[canCheckOwnAttendance, weekStart]`. Truyền `canCheckAttendance={canCheckOwnAttendance}` xuống `WeeklyGrid` (thay `canCheckTeacherAttendance`).

- [ ] **Step 2: Cycle 3 trạng thái trong `handleToggleAttendance`**

Thay thân hàm:
```js
  const handleToggleAttendance = useCallback(async (item, date) => {
    const cls = classes.find(c => c.id === item.classId)
    if (!cls?.teacherId) { toast.error('Không tìm thấy lớp/giáo viên'); return }
    const record = attendanceMap.get(`${item.id}_${date}`)
    const cur = record?.status === 'present' ? 'present' : record?.status === 'absent' ? 'absent' : 'pending'
    try {
      if (cur === 'pending') {
        await teacherAttendanceService.upsert({ scheduleId: item.id, date, teacherId: cls.teacherId, status: 'present', note: record?.note ?? null })
      } else if (cur === 'present') {
        await teacherAttendanceService.upsert({ scheduleId: item.id, date, teacherId: cls.teacherId, status: 'absent', note: record?.note ?? null, substituteTeacherId: record?.substituteTeacherId ?? null })
      } else {
        // absent → pending: xóa record
        await teacherAttendanceService.remove(item.id, date)
      }
      await loadAttendance()
    } catch {
      toast.error('Không thể chấm công')
    }
  }, [classes, attendanceMap, loadAttendance])
```

- [ ] **Step 3: Load buổi dạy thay được giao + state**

Thêm state + loader (mọi GV, kể cả admin — admin cũng có thể là người dạy thay):
```js
  const [subAssignments, setSubAssignments] = useState([])
  const loadSubAssignments = useCallback(async () => {
    const from = toDateStr(weekStart)
    const end = new Date(weekStart); end.setDate(end.getDate() + 6)
    try {
      const rows = await teacherAttendanceService.getSubstituteAssignments(from, toDateStr(end))
      setSubAssignments(rows)
    } catch {
      setSubAssignments([])
    }
  }, [weekStart])
  useEffect(() => { loadSubAssignments() }, [loadSubAssignments])
```

- [ ] **Step 4: Handler xác nhận dạy thay**

```js
  const handleConfirmSubstitute = useCallback(async (assignment) => {
    try {
      await teacherAttendanceService.confirmSubstitute(assignment.scheduleId, assignment.date, true)
      toast.success('Đã xác nhận dạy thay')
      await loadSubAssignments()
    } catch {
      toast.error('Không thể xác nhận')
    }
  }, [loadSubAssignments])
```

- [ ] **Step 5: Render section dạy thay (chỉ khi có assignment), trong tab `schedule`, phía trên lưới**

Đặt ngay trên block "Lưới thời khóa biểu":
```jsx
          {!loading && subAssignments.length > 0 && (
            <SubstituteAssignments
              assignments={subAssignments}
              onConfirm={handleConfirmSubstitute}
            />
          )}
```
Thêm import: `import { SubstituteAssignments } from '@/components/schedule/SubstituteAssignments'`

- [ ] **Step 6: Tạo component `SubstituteAssignments.jsx`**

```jsx
import { clsx } from 'clsx'
import { Repeat, Check } from 'lucide-react'
import { fmtTime, fmtDate } from '@/utils/helpers'

// Danh sách buổi GV hiện tại được giao dạy thay. Card vàng + nút xác nhận.
export const SubstituteAssignments = ({ assignments = [], onConfirm }) => {
  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Repeat size={15} className="text-amber-600" />
        <h3 className="text-sm font-semibold text-navy-800">Buổi được giao dạy thay</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          {assignments.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {assignments.map(a => (
          <div
            key={a.id}
            className={clsx(
              'rounded-xl border p-3 flex items-center justify-between gap-3',
              a.substituteConfirmed
                ? 'border-green-200 border-l-4 border-l-green-500 bg-green-50'
                : 'border-amber-200 border-l-4 border-l-amber-500 bg-amber-50'
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  a.substituteConfirmed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'
                )}>
                  {a.substituteConfirmed ? 'ĐÃ DẠY THAY ✓' : 'DẠY THAY'}
                </span>
                <span className="text-sm font-semibold text-navy-900 truncate">{a.className}</span>
              </div>
              <p className="text-xs text-navy-500 mt-1">
                {fmtDate(a.date)} · {fmtTime(a.startTime)}–{fmtTime(a.endTime)}
                {a.room ? ` · ${a.room}` : ''} · Thay cho {a.mainTeacherName}
              </p>
            </div>
            {a.substituteConfirmed ? (
              <span className="text-xs text-green-600 font-medium shrink-0">Đã tính lương</span>
            ) : (
              <button
                onClick={() => onConfirm?.(a)}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Check size={13} /> Xác nhận đã dạy
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Build check**

Run: `npm run build`
Expected: thành công.

- [ ] **Step 8: Kiểm thử thủ công**

Run: `npm run dev` → mở http://localhost:5173 → trang Giảng Dạy.
Kiểm tra (đăng nhập admin):
1. Chip mặc định card = "Chưa xác nhận" (xám), không còn xanh mặc định.
2. Bấm chip: xám → xanh "Đã dạy" → đỏ "Vắng" → xám (xóa record). Reload trang giữ đúng trạng thái.
3. Khi "Vắng": dropdown gán dạy thay vẫn hoạt động.
4. Gán 1 GV dạy thay → đăng nhập GV đó → thấy section "Buổi được giao dạy thay" với card vàng → bấm "Xác nhận đã dạy" → chuyển xanh "Đã tính lương".
5. Nếu `className`/giờ trong section hiển thị "—"/trống → join bị RLS chặn → báo lại để bổ sung task RLS/denormalize (xem ghi chú Task 2 Step 3).

- [ ] **Step 9: Commit**

```bash
git add src/pages/SchedulePage.jsx src/components/schedule/SubstituteAssignments.jsx
git commit -m "feat(schedule): cycle 3 trạng thái, GV tự chấm, section dạy thay xác nhận"
```

---

### Task 8: Helper format thứ + Admin Panel inline expand

**Files:**
- Modify: `src/utils/helpers.js`
- Modify: `src/pages/AdminPanelPage.jsx`

- [ ] **Step 1: Thêm helper `fmtDayList` vào `helpers.js`**

```js
// Mảng thứ JS (0=CN…6=T7) → chuỗi "T2, T4, T6". Sắp theo thứ tự T2→CN.
const DAY_LABELS = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' }
const DAY_SORT = [1, 2, 3, 4, 5, 6, 0]
export const fmtDayList = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) return '—'
  return [...days].sort((a, b) => DAY_SORT.indexOf(a) - DAY_SORT.indexOf(b))
    .map(d => DAY_LABELS[d] ?? '?').join(', ')
}
```

- [ ] **Step 2: Thêm state expand vào `AdminPanelPage`**

Sau các `useState` hiện có:
```js
  const [expandedTeacherId, setExpandedTeacherId] = useState(null)
```
Thêm import:
```js
import { fmtVND, fmtDayList, fmtTime } from '@/utils/helpers'
import { Plus, Users, GraduationCap, UserCog, AlertCircle, ChevronRight, ChevronDown, ChevronUp, ShieldCheck, ShieldOff, Pencil, X } from 'lucide-react'
```
(thêm `fmtDayList`, `fmtTime`, `ChevronDown`, `ChevronUp` vào import sẵn có)

- [ ] **Step 3: Thêm nút chevron expand vào card GV + danh sách lớp inline**

Trong block card GV (sau khối "Lương tháng", trước "Admin toggle button"), thêm:
```jsx
                    {/* Toggle expand lịch dạy */}
                    <div className="px-4 pb-2">
                      <button
                        onClick={() => setExpandedTeacherId(expandedTeacherId === t.id ? null : t.id)}
                        className="flex items-center gap-1 text-xs font-medium text-navy-500 hover:text-navy-800 transition-colors"
                      >
                        {expandedTeacherId === t.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {expandedTeacherId === t.id ? 'Ẩn lịch dạy' : 'Xem lịch dạy'}
                      </button>
                    </div>

                    {expandedTeacherId === t.id && (
                      <div className="px-4 pb-3 border-t border-dashed border-navy-100 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-navy-400 mb-1.5">
                          Lớp phụ trách &amp; lịch dạy
                        </p>
                        {classes.filter(c => c.teacherId === t.id).length === 0 ? (
                          <p className="text-xs text-navy-400">Chưa có lớp nào</p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {classes.filter(c => c.teacherId === t.id).map(c => (
                              <div key={c.id} className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-navy-800 truncate">{c.name}</p>
                                  <p className="text-[11px] text-navy-500">
                                    {fmtDayList(c.scheduleDayList)}
                                    {c.startTime ? ` · ${fmtTime(c.startTime)}–${fmtTime(c.endTime)}` : ''}
                                    {c.room ? ` · ${c.room}` : ''}
                                  </p>
                                </div>
                                {c.courseType && (
                                  <span className="text-[10px] bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded shrink-0">
                                    {c.courseType}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: thành công.

- [ ] **Step 5: Kiểm thử thủ công**

`npm run dev` → đăng nhập admin → Bảng Điều Khiển Admin → card GV có nút "Xem lịch dạy" → bấm hiện danh sách lớp + lịch ("T2, T4, T6 · 17:00–19:00 · Phòng 3"). Bấm lại để ẩn. Lọc lớp ở cột phải vẫn hoạt động (không xung đột).

- [ ] **Step 6: Commit**

```bash
git add src/utils/helpers.js src/pages/AdminPanelPage.jsx
git commit -m "feat(admin): inline expand lịch dạy theo giáo viên + helper fmtDayList"
```

---

### Task 9: PayrollTab — cột "Chưa xác nhận"

**Files:**
- Modify: `src/components/schedule/PayrollTab.jsx`

- [ ] **Step 1: Thêm cột pending vào bảng + export**

`pending = max(0, scheduled - taught - absent)` tính tại render. Thêm vào `excelColumns` sau `absent`:
```js
    { key: 'pending', label: 'Chưa xác nhận' },
```
Trong `excelRows`, map thêm:
```js
    pending: Math.max(0, r.scheduled - r.taught - r.absent),
```
Thêm `<th>` (sau cột "Vắng"):
```jsx
                <th className="py-2 pr-3 font-medium text-navy-600 text-center">Chưa XN</th>
```
Thêm `<td>` tương ứng trong hàng (sau ô absent):
```jsx
                  <td className="py-1.5 pr-3 text-slate-500 text-center">{Math.max(0, r.scheduled - r.taught - r.absent)}</td>
```

- [ ] **Step 2: Build check + kiểm thử**

`npm run build`; `npm run dev` → tab Bảng Lương: cột "Chưa XN" hiện đúng (scheduled − taught − absent). Admin thấy mọi GV; GV thường chỉ thấy mình.

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule/PayrollTab.jsx
git commit -m "feat(payroll): thêm cột Chưa xác nhận trong bảng lương"
```

---

### Task 10: Seed + tài liệu

**Files:**
- Modify: `supabase/seed/seed_mock_data.sql`
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Đồng bộ seed**

Mở `supabase/seed/seed_mock_data.sql`, tìm phần insert `teacher_attendance` (nếu có). Đảm bảo:
- Một số record `status='present'` (buổi đã xác nhận → tính lương).
- Ít nhất 1 record `status='absent'` có `substitute_teacher_id` + `substitute_confirmed = true` (dạy thay đã xác nhận).
- Nếu file chưa insert `teacher_attendance`, thêm vài dòng mẫu sau block schedule, scope theo teacher mock (giữ idempotent). Dùng cột mới `substitute_confirmed`.

Run: `grep -n "teacher_attendance" supabase/seed/seed_mock_data.sql` để xác định vị trí.

- [ ] **Step 2: Cập nhật CLAUDE.md**

Trong mục "Chấm công giáo viên" và "Mô hình lương": sửa mô tả từ "mặc định Đã dạy, bấm toggle sang Vắng" → **opt-in 3 trạng thái** (Chưa xác nhận = không record = không tính lương; Đã dạy = present; Vắng = absent; cycle xóa record khi về pending). Bổ sung:
- GV **tự chấm công** lớp mình (RLS mới: teacher self insert/update/delete).
- Dạy thay: thêm `substitute_confirmed`; GV dạy thay **tự xác nhận** qua section "Buổi được giao dạy thay" (`SubstituteAssignments.jsx`); lương dạy thay chỉ tính khi `substitute_confirmed=true`.
- Công thức lương: `taught = số buổi present`, `subs = số dạy thay đã xác nhận`.
- `usePermissions`: thêm `canCheckAllAttendance` / `canCheckOwnAttendance`.
- Admin Panel: card GV expand lịch dạy theo lớp.
- Migration mới `20260625000001_...`.

- [ ] **Step 3: Cập nhật README.md**

Cập nhật phần mô tả chấm công/lương (nếu có) cho khớp mô hình opt-in + dạy thay xác nhận.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed/seed_mock_data.sql CLAUDE.md README.md
git commit -m "docs: cập nhật seed + CLAUDE.md/README cho chấm công opt-in & dạy thay"
```

---

## Self-review (đã thực hiện)

**Spec coverage:**
- ① Admin inline expand → Task 8 ✅
- ② Chấm công opt-in 3 trạng thái → Task 5, 6, 7 ✅
- ③ Dạy thay xác nhận → Task 1 (cột+RLS), 2 (service), 7 (UI section) ✅
- ④ Công thức lương → Task 3 ✅
- ⑤ DB & RLS → Task 1 ✅
- ⑥ Phân quyền → Task 4 ✅
- Seed + docs → Task 10 ✅

**Placeholder scan:** Không có TBD/“xử lý lỗi phù hợp” — mọi step có code/đường dẫn/lệnh cụ thể. Điểm rủi ro RLS join được nêu rõ kèm hành động cụ thể (báo lại, không tự đổi schema).

**Type consistency:** `substituteConfirmed` (camelCase service) ↔ `substitute_confirmed` (snake_case DB) nhất quán; `getSubstituteAssignments`/`confirmSubstitute`/`fmtDayList` dùng đúng tên ở mọi nơi tham chiếu; `canCheckOwnAttendance`/`canCheckAllAttendance` dùng thống nhất Task 4 ↔ Task 7.

**Lưu ý vận hành:** Migration Task 1 phải được áp dụng lên Supabase trước khi kiểm thử ghi dữ liệu của GV thường (Task 7 Step 8).
