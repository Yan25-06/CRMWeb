# Nhiều giáo viên / 1 lớp + Học phí dạng tick — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuyển học phí sang mô hình "một ô tick / học sinh / lớp / tháng" với mức phí cố định đặt ở lớp, và cho phép một lớp có nhiều giáo viên bằng cách gắn giáo viên vào từng ca trong `schedule`.

**Architecture:** Hai thay đổi độc lập. (1) Học phí: `classes.monthly_fee` là mức phí duy nhất, `fees.paid` là trạng thái duy nhất; bảng `payments` và các cột phí trên `enrollments` trở thành orphan. (2) Nhiều GV: thêm `schedule.teacher_id` (null = GV phụ trách lớp) và một hàm Postgres `can_access_class(uuid)` thay cho điều kiện `classes.teacher_id = auth.uid()` trong RLS.

**Tech Stack:** React 18 + Vite, Tailwind 3 (navy tokens), Supabase (Postgres + RLS), lucide-react, clsx. Không có test runner; logic thuần được test bằng script Node (`node scripts/test-*.mjs`), phần UI test bằng tay.

Spec: [docs/superpowers/specs/2026-09-18-multi-teacher-and-tick-fees-design.md](../specs/2026-09-18-multi-teacher-and-tick-fees-design.md)

## Global Constraints

- Ngôn ngữ UI: **tiếng Việt**, **sentence case** cho mọi nhãn/tiêu đề/nút ("Học phí", "Đã đóng"). Không Title Case. Ngoại lệ: danh từ riêng (`Mock Test`, `Excel`, `Admin`) và tên thứ (`Thứ Hai`).
- **Không hard-code màu hex.** Chỉ dùng navy token của Tailwind (`bg-navy-800`, `text-navy-700`, `border-navy-100`…). Chữ nội dung trên nền sáng dùng `navy-500` trở lên; `navy-300/400` chỉ cho icon trang trí, viền, placeholder.
- Dùng component từ `@/components/ui` (`Button`, `Badge`, `Card`, `Input`, `Select`, `Modal`, `StatCard`, `Empty`, `Skeleton`, `toast`). Không tự tạo button/input mới.
- Functional components + hooks. Import qua alias `@/`, không relative path dài. `clsx()` cho conditional class, không template literal.
- **Không gọi `supabase.*` trực tiếp trong component** — luôn qua service layer trong `src/services/`.
- Nhãn form: `text-sm font-medium text-navy-700`, không uppercase.
- Mọi `truncate` phải kèm `title=`.
- Toast sau mỗi action (`toast.success` / `toast.error`), loading state cho mọi async, `<Empty />` khi list rỗng, confirm trước khi xóa.
- Tiền tệ: `fmtVND` trong `@/utils/helpers` (`Intl.NumberFormat('vi-VN')` + `đ`). Ngày lưu dạng `YYYY-MM-DD`.
- Phân quyền UI qua `usePermissions()`, **không** đọc `teacher.is_admin` trực tiếp trong component.
- Migration SQL đặt trong `supabase/migrations/`, đặt tên `<timestamp>_<snake_case>.sql`, mở đầu bằng comment nêu mục đích + cách rollback (theo mẫu các migration hiện có).
- Commit sau mỗi task. Message tiếng Anh, dạng `feat:` / `fix:` / `refactor:` / `docs:`, kết thúc bằng:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  ```

## Cấu trúc file

**Tạo mới**
- `supabase/migrations/20260918000001_simplify_fees_to_paid_flag.sql` — thêm `classes.monthly_fee`, backfill `fees.paid` từ `payments`, backfill mức phí lớp.
- `supabase/migrations/20260918000002_multi_teacher_per_class.sql` — `schedule.teacher_id`, hàm `can_access_class`, viết lại RLS.
- `src/utils/fees.js` — logic thuần cho trang Học phí (lọc + đếm học sinh duy nhất).
- `scripts/test-fees.mjs` — test Node cho `src/utils/fees.js`.
- `scripts/test-payroll.mjs` — test Node cho `src/utils/payroll.js`.

**Sửa**
- `src/services/feeService.js` — rút gọn còn `buildFeesRows` + `setPaid`.
- `src/services/classService.js` — map `monthlyFee`; truyền `teacherByDay` vào `syncForClass`.
- `src/services/scheduleService.js` — map `teacherId`; `syncForClass` nhận `teacherByDay`.
- `src/utils/payroll.js` — `scheduled` theo GV của từng ca.
- `src/pages/FeesPage.jsx`, `src/components/fees/FeesTable.jsx` — chuyển sang tick.
- `src/pages/DashboardPage.jsx`, `src/pages/AdminPanelPage.jsx`, `src/pages/ReportsPage.jsx` — bỏ `paymentService`.
- `src/components/classes/ClassModal.jsx` — ô học phí lớp + dropdown GV theo thứ.
- `src/pages/SchedulePage.jsx`, `src/components/schedule/WeeklyGrid.jsx`, `src/components/schedule/ScheduleCard.jsx` — GV theo ca.
- Các form ghi danh (danh sách đầy đủ ở Task 5).
- `supabase/seed/seed_mock_data.sql`, `CLAUDE.md`, `README.md`.

**Xóa**
- `src/services/paymentService.js`, `src/components/fees/PaymentModal.jsx`, `src/components/fees/StudentPaymentHistoryPanel.jsx`, `src/components/students/BulkFeeModal.jsx`, `src/components/students/BulkFeeFields.jsx`.

---

# Phần A — Học phí dạng tick

### Task 1: Migration học phí

**Files:**
- Create: `supabase/migrations/20260918000001_simplify_fees_to_paid_flag.sql`

**Interfaces:**
- Consumes: schema hiện có (`classes`, `enrollments.fee_type/monthly_fee/course_fee`, `fees.surcharge/paid`, `payments.amount/period/class_id`).
- Produces: cột `classes.monthly_fee integer null`; các dòng `fees` có `paid = true` cho những cặp đã đóng đủ theo công thức cũ.

- [ ] **Step 1: Viết migration**

Tạo `supabase/migrations/20260918000001_simplify_fees_to_paid_flag.sql`:

```sql
-- =========================================================================
-- Migration: Học phí chuyển sang mô hình "một ô tick"
-- Change: simplify-fees-to-paid-flag
--
-- - Mức học phí là thuộc tính của LỚP (classes.monthly_fee), không còn đặt
--   theo từng enrollment. Mọi học sinh trong lớp đóng như nhau.
-- - Trạng thái đóng phí là nhị phân: fees.paid. Không còn "đóng một phần".
-- - Các cột/bảng thôi dùng được giữ lại làm orphan (không drop) theo tiền lệ
--   của repo (monthly_salary, settings.teacher_name, class_materials):
--     enrollments.fee_type / monthly_fee / course_fee
--     fees.surcharge
--     payments (toàn bộ bảng — giữ lịch sử số tiền để tra cứu bằng SQL)
--
-- Rollback:
--   alter table public.classes drop column if exists monthly_fee;
--   (dữ liệu fees.paid do backfill đặt ra không tự khôi phục được — lịch sử
--    gốc vẫn nằm nguyên trong bảng payments.)
-- =========================================================================

alter table public.classes
  add column if not exists monthly_fee integer;

comment on column public.classes.monthly_fee is
  'Học phí cố định mỗi tháng của lớp (VNĐ). Nguồn duy nhất cho mức phí.';

-- -------------------------------------------------------------------------
-- Backfill 1: classes.monthly_fee = mức phí tháng phổ biến nhất trong các
-- enrollment chưa dropped của lớp. Lớp không có enrollment nào → để null.
-- -------------------------------------------------------------------------
with mode_fee as (
  select distinct on (e.class_id)
         e.class_id,
         e.monthly_fee,
         count(*) as n
  from public.enrollments e
  where e.status <> 'dropped'
    and e.monthly_fee is not null
    and e.monthly_fee > 0
  group by e.class_id, e.monthly_fee
  order by e.class_id, n desc, e.monthly_fee desc
)
update public.classes c
set monthly_fee = m.monthly_fee
from mode_fee m
where m.class_id = c.id
  and c.monthly_fee is null;

-- -------------------------------------------------------------------------
-- Backfill 2: fees.paid = true cho mỗi (student, class, year, month) mà tổng
-- payments của kỳ đó >= số phải đóng theo công thức CŨ.
-- Đóng một phần → không đạt ngưỡng → giữ paid = false (đã xác nhận với
-- người dùng trong spec).
-- -------------------------------------------------------------------------
with expected as (
  select e.student_id,
         e.class_id,
         f.year,
         f.month,
         case
           when e.fee_type = 'course' then coalesce(e.course_fee, 0)
           else coalesce(e.monthly_fee, 0) + coalesce(f.surcharge, 0)
         end as amount_due
  from public.enrollments e
  join public.fees f
    on f.student_id = e.student_id
   and f.class_id = e.class_id
  where e.status <> 'dropped'
),
paid_sum as (
  select p.student_id,
         p.class_id,
         split_part(p.period, '-', 1)::int as year,
         split_part(p.period, '-', 2)::int as month,
         sum(coalesce(p.amount, 0)) as amount_paid
  from public.payments p
  where p.class_id is not null
    and p.period ~ '^[0-9]{4}-[0-9]{2}$'
  group by p.student_id, p.class_id, p.period
)
update public.fees f
set paid = true
from expected ex
join paid_sum ps
  on ps.student_id = ex.student_id
 and ps.class_id   = ex.class_id
 and ps.year       = ex.year
 and ps.month      = ex.month
where f.student_id = ex.student_id
  and f.class_id   = ex.class_id
  and f.year       = ex.year
  and f.month      = ex.month
  and ex.amount_due > 0
  and ps.amount_paid >= ex.amount_due;
```

- [ ] **Step 2: Chạy migration trên Supabase**

Mở **Supabase SQL Editor**, dán toàn bộ file, Run. Kỳ vọng: không lỗi.

- [ ] **Step 3: Kiểm chứng bằng SQL**

Chạy trong SQL Editor:

```sql
select count(*) as classes_with_fee from public.classes where monthly_fee is not null;
select paid, count(*) from public.fees group by paid;
```

Kỳ vọng: `classes_with_fee` > 0 nếu dữ liệu cũ có học phí; bảng `fees` có ít nhất một dòng `paid = true` nếu trước đó có thanh toán đủ. Nếu database đang trống (chưa seed) thì cả hai trả 0 — vẫn hợp lệ.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260918000001_simplify_fees_to_paid_flag.sql
git commit -m "feat(db): add classes.monthly_fee and backfill fees.paid

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Mức học phí trên lớp (service + ClassModal + hiển thị)

**Files:**
- Modify: `src/services/classService.js` (`fromDB` ~line 13, `toDB` ~line 43)
- Modify: `src/components/classes/ClassModal.jsx`

**Interfaces:**
- Consumes: `classes.monthly_fee` (Task 1).
- Produces: field `monthlyFee` (number | null) trên object class trả về từ `classService.getAll/getById`; `ClassModal` gửi `monthlyFee` trong payload `onSave`.

- [ ] **Step 1: Map `monthlyFee` trong classService**

Trong `src/services/classService.js`, thêm vào `fromDB` (ngay sau dòng `room: row.room,`):

```js
  monthlyFee: row.monthly_fee ?? null,
```

Và trong `toDB`, thêm vào cuối, ngay trước `return obj`:

```js
  if (data.monthlyFee !== undefined) {
    obj.monthly_fee = data.monthlyFee === '' || data.monthlyFee === null
      ? null
      : Number(data.monthlyFee) || 0
  }
```

Đặt ngoài khối `if (data.scheduleDayList !== undefined)` — học phí độc lập với lịch học.

- [ ] **Step 2: Thêm ô học phí vào ClassModal**

Trong `src/components/classes/ClassModal.jsx`:

Thêm `monthlyFee: ''` vào cả hai object khởi tạo `formData` (nhánh `useState` đầu file, nhánh `if (classItem)` và nhánh `else` trong `useEffect`). Với nhánh `classItem`:

```js
          monthlyFee: classItem.monthlyFee != null ? String(classItem.monthlyFee) : '',
```

Trong `handleChange`, thêm nhánh lọc số bên cạnh nhánh `maxStudents` đang có:

```js
    if (name === 'maxStudents' || name === 'monthlyFee') {
      const digits = value.replace(/\D/g, '')
      parsed = Number(digits) || 0
    }
```

Thêm field vào form, ngay sau `<Input label="Phòng học (tùy chọn)" ... />`:

```jsx
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <Input
              label="Học phí mỗi tháng (VNĐ)"
              name="monthlyFee"
              type="text"
              inputMode="numeric"
              value={formData.monthlyFee || ''}
              onChange={handleChange}
              placeholder="VD: 1200000"
            />
            {Number(formData.monthlyFee) > 0 && (
              <p className="text-xs text-navy-500">{fmtVND(Number(formData.monthlyFee))} / tháng</p>
            )}
          </div>
        )}
```

Thêm import ở đầu file:

```js
import { fmtVND } from '@/utils/helpers'
```

`handleSubmit` đã spread `...formData` nên `monthlyFee` tự đi kèm — không cần sửa.

- [ ] **Step 3: Hiển thị mức phí ở danh sách lớp**

Mở `src/pages/ClassesOverviewPage.jsx`, tìm phần render thông tin phụ của thẻ lớp (dòng có lịch học / sĩ số). Thêm ngay dưới đó:

```jsx
              {cls.monthlyFee > 0 && (
                <div className="text-xs text-navy-500">
                  Học phí {fmtVND(cls.monthlyFee)}/tháng
                </div>
              )}
```

Dùng đúng tên biến class item mà file đó đang dùng trong vòng lặp. Thêm `fmtVND` vào import từ `@/utils/helpers` nếu chưa có.

- [ ] **Step 4: Kiểm chứng bằng tay**

Chạy `npm run dev`. Đăng nhập tài khoản admin:
1. Mở Lớp học → Sửa một lớp → nhập "1200000" vào "Học phí mỗi tháng" → thấy dòng phụ "1.200.000đ / tháng" → Lưu.
2. Reload trang → mở lại lớp đó → ô học phí vẫn còn giá trị.
3. Thẻ lớp ở danh sách hiện "Học phí 1.200.000đ/tháng".
4. Đăng nhập tài khoản giáo viên thường → mở Sửa lớp → **không** thấy ô học phí.

- [ ] **Step 5: Commit**

```bash
git add src/services/classService.js src/components/classes/ClassModal.jsx src/pages/ClassesOverviewPage.jsx
git commit -m "feat(classes): set fixed monthly fee on the class

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Logic thuần cho trang Học phí

**Files:**
- Create: `src/utils/fees.js`
- Create: `scripts/test-fees.mjs`

**Interfaces:**
- Consumes: không có (hàm thuần).
- Produces:
  - `filterFeeRows(rows, { className, status })` → `FeeRow[]`. `className`/`status` nhận `'all'` để bỏ lọc; `status` ∈ `'all' | 'paid' | 'debt'`.
  - `countFeeStudents(rows)` → `{ total: number, paid: number, debt: number }` — đếm **học sinh duy nhất**; một học sinh chỉ tính `paid` khi mọi dòng lớp của họ đều `paid === true`.
  - `FeeRow` = `{ studentId: string, classId: string, name: string, className: string, monthlyFee: number, paid: boolean }`.

- [ ] **Step 1: Viết test trước**

Tạo `scripts/test-fees.mjs`:

```js
import assert from 'node:assert/strict'
import { filterFeeRows, countFeeStudents } from '../src/utils/fees.js'

let passed = 0
const test = (name, fn) => { fn(); passed++; console.log('  ✓', name) }

const rows = [
  { studentId: 's1', classId: 'c1', name: 'An',  className: 'IELTS 1', monthlyFee: 1000, paid: true },
  { studentId: 's1', classId: 'c2', name: 'An',  className: 'TOEIC 1', monthlyFee: 2000, paid: false },
  { studentId: 's2', classId: 'c1', name: 'Bình', className: 'IELTS 1', monthlyFee: 1000, paid: true },
  { studentId: 's3', classId: 'c2', name: 'Chi', className: 'TOEIC 1', monthlyFee: 2000, paid: false },
]

test('filterFeeRows: "all" giữ nguyên mọi dòng', () => {
  assert.equal(filterFeeRows(rows, { className: 'all', status: 'all' }).length, 4)
})

test('filterFeeRows: lọc theo tên lớp', () => {
  const out = filterFeeRows(rows, { className: 'IELTS 1', status: 'all' })
  assert.deepEqual(out.map(r => r.studentId), ['s1', 's2'])
})

test('filterFeeRows: lọc theo trạng thái', () => {
  assert.equal(filterFeeRows(rows, { className: 'all', status: 'paid' }).length, 2)
  assert.equal(filterFeeRows(rows, { className: 'all', status: 'debt' }).length, 2)
})

test('filterFeeRows: lọc lớp và trạng thái cùng lúc', () => {
  const out = filterFeeRows(rows, { className: 'TOEIC 1', status: 'debt' })
  assert.deepEqual(out.map(r => r.studentId), ['s1', 's3'])
})

test('countFeeStudents: học sinh đa lớp chỉ tính đủ khi MỌI lớp đã tick', () => {
  assert.deepEqual(countFeeStudents(rows), { total: 3, paid: 1, debt: 2 })
})

test('countFeeStudents: mọi lớp đã tick thì không còn nợ', () => {
  const allPaid = rows.map(r => ({ ...r, paid: true }))
  assert.deepEqual(countFeeStudents(allPaid), { total: 3, paid: 3, debt: 0 })
})

test('countFeeStudents: danh sách rỗng', () => {
  assert.deepEqual(countFeeStudents([]), { total: 0, paid: 0, debt: 0 })
})

console.log(`\n${passed} test đã pass.`)
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

Run: `node scripts/test-fees.mjs`
Expected: FAIL — `Cannot find module .../src/utils/fees.js`

- [ ] **Step 3: Viết implementation tối thiểu**

Tạo `src/utils/fees.js`:

```js
// Logic thuần cho trang Học phí — KHÔNG import React/supabase để test bằng Node.
// FeeRow = { studentId, classId, name, className, monthlyFee, paid }

export function filterFeeRows(rows, { className = 'all', status = 'all' } = {}) {
  return (rows ?? []).filter(r => {
    if (className !== 'all' && r.className !== className) return false
    if (status === 'paid' && !r.paid) return false
    if (status === 'debt' && r.paid) return false
    return true
  })
}

// Đếm theo HỌC SINH DUY NHẤT, không theo dòng lớp: một học sinh học nhiều lớp
// chỉ tính "đã đóng đủ" khi mọi lớp đều đã tick.
export function countFeeStudents(rows) {
  const paidByStudent = new Map()
  for (const r of rows ?? []) {
    const prev = paidByStudent.get(r.studentId)
    paidByStudent.set(r.studentId, prev === undefined ? !!r.paid : prev && !!r.paid)
  }
  let paid = 0
  for (const allPaid of paidByStudent.values()) if (allPaid) paid++
  const total = paidByStudent.size
  return { total, paid, debt: total - paid }
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `node scripts/test-fees.mjs`
Expected: PASS — `7 test đã pass.`

- [ ] **Step 5: Commit**

```bash
git add src/utils/fees.js scripts/test-fees.mjs
git commit -m "feat(fees): add pure helpers for fee row filtering and counting

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: feeService + trang Học phí chuyển sang tick

**Files:**
- Modify: `src/services/feeService.js` (viết lại toàn bộ)
- Modify: `src/pages/FeesPage.jsx` (viết lại toàn bộ)
- Modify: `src/components/fees/FeesTable.jsx` (viết lại toàn bộ)
- Delete: `src/components/fees/PaymentModal.jsx`, `src/components/fees/StudentPaymentHistoryPanel.jsx`

**Interfaces:**
- Consumes: `classes.monthly_fee` (Task 1), `filterFeeRows` / `countFeeStudents` từ `@/utils/fees` (Task 3).
- Produces:
  - `feeService.buildFeesRows(year, month)` → `Promise<FeeRow[]>` với `FeeRow` như định nghĩa ở Task 3.
  - `feeService.setPaid(studentId, classId, year, month, paid)` → `Promise<void>`.
  - `FeesTable` props: `{ rows: FeeRow[], onTogglePaid: (row: FeeRow, nextPaid: boolean) => void }`.

- [ ] **Step 1: Viết lại feeService**

Thay toàn bộ nội dung `src/services/feeService.js`:

```js
import { supabase } from '@/lib/supabase'

export const feeService = {
  // Một dòng cho mỗi enrollment chưa dropped. Học phí lấy từ LỚP; trạng thái
  // đóng phí là cờ nhị phân fees.paid theo (student, class, year, month).
  async buildFeesRows(year, month) {
    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select('student_id, class_id, students(id, name), classes(id, name, monthly_fee)')
      .neq('status', 'dropped')
    if (enrErr) throw new Error(enrErr.message)
    if (!enrollments || enrollments.length === 0) return []

    const studentIds = [...new Set(enrollments.map(e => e.student_id))]

    const { data: feeRecords, error: feeErr } = await supabase
      .from('fees')
      .select('student_id, class_id, paid')
      .in('student_id', studentIds)
      .eq('year', year)
      .eq('month', month)
    if (feeErr) throw new Error(feeErr.message)

    const key = (studentId, classId) => `${studentId}:${classId}`
    const paidByKey = new Map()
    for (const f of feeRecords ?? []) {
      if (!f.class_id) continue
      paidByKey.set(key(f.student_id, f.class_id), !!f.paid)
    }

    return enrollments.map(e => ({
      studentId: e.student_id,
      classId: e.class_id,
      name: e.students?.name ?? '—',
      className: e.classes?.name ?? '—',
      monthlyFee: e.classes?.monthly_fee ?? 0,
      paid: paidByKey.get(key(e.student_id, e.class_id)) ?? false,
    }))
  },

  async setPaid(studentId, classId, year, month, paid) {
    const { error } = await supabase
      .from('fees')
      .upsert(
        { student_id: studentId, class_id: classId, year, month, paid },
        { onConflict: 'student_id,class_id,year,month' },
      )
    if (error) throw new Error(error.message)
  },
}
```

- [ ] **Step 2: Viết lại FeesTable**

Thay toàn bộ nội dung `src/components/fees/FeesTable.jsx`:

```jsx
import { useState } from 'react'
import { clsx } from 'clsx'
import { Badge } from '@/components/ui'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { fmtVND } from '@/utils/helpers'

export const FeesTable = ({ rows, onTogglePaid }) => {
  const [sortAsc, setSortAsc] = useState(true)

  const sorted = [...rows].sort((a, b) =>
    sortAsc ? a.name.localeCompare(b.name, 'vi') : b.name.localeCompare(a.name, 'vi')
  )

  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead>
            <tr className="bg-navy-50/60 border-b border-navy-100">
              <th
                className="px-5 py-3 font-semibold text-navy-700 cursor-pointer select-none"
                onClick={() => setSortAsc(a => !a)}
              >
                <span className="flex items-center gap-1">
                  Học viên
                  {sortAsc ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </th>
              <th className="px-5 py-3 font-semibold text-navy-700">Lớp</th>
              <th className="px-5 py-3 font-semibold text-navy-700 text-right">Học phí</th>
              <th className="px-5 py-3 font-semibold text-navy-700 text-center">Trạng thái</th>
              <th className="px-5 py-3 font-semibold text-navy-700 text-center w-32">Đã đóng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50">
            {sorted.map(row => (
              <tr
                key={`${row.studentId}-${row.classId}`}
                className="hover:bg-navy-50/40 transition-colors"
              >
                <td className="px-5 py-3 font-medium text-navy-900">{row.name}</td>
                <td className="px-5 py-3 text-navy-500">{row.className}</td>
                <td className="px-5 py-3 text-right text-navy-700">
                  {row.monthlyFee > 0 ? fmtVND(row.monthlyFee) : '—'}
                </td>
                <td className="px-5 py-3 text-center">
                  <Badge variant={row.paid ? 'success' : 'danger'}>
                    {row.paid ? 'Đã đóng' : 'Chưa đóng'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-center">
                  <label
                    className="inline-flex items-center justify-center cursor-pointer"
                    title={row.paid ? 'Bỏ đánh dấu đã đóng' : 'Đánh dấu đã đóng'}
                  >
                    <input
                      type="checkbox"
                      checked={row.paid}
                      onChange={e => onTogglePaid(row, e.target.checked)}
                      className={clsx(
                        'w-5 h-5 rounded-md cursor-pointer',
                        'accent-navy-800 border-navy-200'
                      )}
                      aria-label={`Học phí của ${row.name} tại lớp ${row.className}`}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-2 border-t border-navy-50 text-xs text-navy-500">
        {sorted.length} dòng · Tick vào ô để đánh dấu đã đóng
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Viết lại FeesPage**

Thay toàn bộ nội dung `src/pages/FeesPage.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { StatCard, Empty, Skeleton, Select, toast } from '@/components/ui'
import { Users, AlertCircle } from 'lucide-react'
import { FeesTable } from '@/components/fees/FeesTable'
import { feeService } from '@/services/feeService'
import { filterFeeRows, countFeeStudents } from '@/utils/fees'
import { ExportExcelButton } from '@/components/reports/ExportExcelButton'

const PAYMENT_TABS = [
  { id: 'all',  label: 'Tất cả' },
  { id: 'debt', label: 'Chưa đóng' },
  { id: 'paid', label: 'Đã đóng' },
]

const FEE_EXPORT_COLUMNS = [
  { key: 'name',      label: 'Học sinh' },
  { key: 'className', label: 'Lớp' },
  { key: 'period',    label: 'Tháng' },
  { key: 'status',    label: 'Trạng thái' },
]

export const FeesPage = ({ year, month }) => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [payStatusFilter, setPayStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await feeService.buildFeesRows(year, month)
      setRows(data)
    } catch {
      toast.error('Không tải được dữ liệu học phí')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [year, month])

  useEffect(() => { refresh() }, [refresh])

  // Optimistic: đổi cờ tại chỗ, revert nếu ghi lỗi.
  const handleTogglePaid = async (row, nextPaid) => {
    const apply = (value) => setRows(prev => prev.map(r =>
      r.studentId === row.studentId && r.classId === row.classId
        ? { ...r, paid: value }
        : r
    ))
    apply(nextPaid)
    try {
      await feeService.setPaid(row.studentId, row.classId, year, month, nextPaid)
      toast.success(nextPaid ? 'Đã đánh dấu đã đóng' : 'Đã bỏ đánh dấu')
    } catch {
      apply(!nextPaid)
      toast.error('Lưu không thành công, vui lòng thử lại.')
    }
  }

  const uniqueClassNames = [...new Set(rows.map(r => r.className).filter(Boolean))].sort()

  const classFilteredRows = filterFeeRows(rows, { className: classFilter, status: 'all' })
  const { total, paid: paidCount, debt: debtCount } = countFeeStudents(classFilteredRows)

  const tabCounts = {
    all:  classFilteredRows.length,
    debt: filterFeeRows(classFilteredRows, { status: 'debt' }).length,
    paid: filterFeeRows(classFilteredRows, { status: 'paid' }).length,
  }

  const filteredRows = filterFeeRows(classFilteredRows, { status: payStatusFilter })

  const exportRows = filteredRows.map(r => ({
    ...r,
    period: `${month}/${year}`,
    status: r.paid ? 'Đã đóng' : 'Chưa đóng',
  }))

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-900">Học phí</h1>
          <p className="text-sm text-navy-500 mt-0.5">Tháng {month}/{year}</p>
        </div>
        <ExportExcelButton
          rows={exportRows}
          columns={FEE_EXPORT_COLUMNS}
          filename={`hoc-phi-thang-${month}-${year}`}
          disabled={loading || filteredRows.length === 0}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        {loading ? (
          [1, 2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Đã đóng đủ"
              value={`${paidCount}/${total}`}
              sub="học viên"
              icon={<Users size={16} />}
              accent="success"
            />
            <StatCard
              label="Chưa đóng"
              value={String(debtCount)}
              sub={debtCount > 0 ? 'học viên' : 'Tất cả đã đóng'}
              icon={<AlertCircle size={16} />}
              accent={debtCount > 0 ? 'danger' : 'success'}
            />
          </>
        )}
      </div>

      {/* Filters: class + payment status */}
      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {uniqueClassNames.length > 0 && (
            <>
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium text-navy-700">Lớp:</span>
                <Select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className="text-sm w-auto"
                >
                  <option value="all">Tất cả lớp</option>
                  {uniqueClassNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </label>
              <span className="hidden sm:block w-px h-6 bg-navy-200 shrink-0" aria-hidden="true" />
            </>
          )}
          <div className="flex gap-1 flex-wrap">
            {PAYMENT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setPayStatusFilter(tab.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                  payStatusFilter === tab.id
                    ? 'bg-navy-800 text-white'
                    : 'bg-white text-navy-500 border border-navy-100 hover:text-navy-800 hover:border-navy-300'
                )}
              >
                {tab.label}
                <span className={clsx(
                  'ml-1.5 text-xs font-normal',
                  payStatusFilter === tab.id ? 'text-navy-200' : 'text-navy-500'
                )}>
                  ({tabCounts[tab.id]})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table or empty state */}
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 rounded-xl" />
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Empty
          icon="💰"
          title="Chưa có học viên nào trong tháng này"
          desc="Thêm học viên vào lớp để bắt đầu theo dõi học phí"
        />
      ) : filteredRows.length === 0 ? (
        <Empty
          icon="🔍"
          title={`Không có học sinh nào trong nhóm "${PAYMENT_TABS.find(t => t.id === payStatusFilter)?.label}"`}
          desc="Thử chọn bộ lọc khác"
        />
      ) : (
        <FeesTable rows={filteredRows} onTogglePaid={handleTogglePaid} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Xóa hai component không còn dùng**

```bash
git rm src/components/fees/PaymentModal.jsx src/components/fees/StudentPaymentHistoryPanel.jsx
```

- [ ] **Step 5: Xác nhận không còn chỗ nào import chúng**

Run: `grep -rn "PaymentModal\|StudentPaymentHistoryPanel" src/`
Expected: không có kết quả.

- [ ] **Step 6: Kiểm chứng bằng tay**

`npm run dev`, đăng nhập admin, mở trang Học phí:
1. Mỗi học sinh hiện một dòng cho mỗi lớp, cột Học phí lấy từ mức phí của lớp.
2. Tick một ô → badge đổi sang "Đã đóng" ngay, toast thành công; reload trang vẫn giữ.
3. Bỏ tick → quay lại "Chưa đóng", reload vẫn giữ.
4. Đổi tháng ở thanh trên → trạng thái tick đổi theo tháng.
5. Tab "Chưa đóng" / "Đã đóng" ra đúng số; thẻ "Đã đóng đủ" đếm theo học sinh (học sinh 2 lớp mới tick 1 lớp thì vẫn nằm ở "Chưa đóng").
6. Xuất Excel tải được file có cột Trạng thái.

- [ ] **Step 7: Commit**

```bash
git add -A src/services/feeService.js src/pages/FeesPage.jsx src/components/fees/
git commit -m "feat(fees): replace payment amounts with a single paid checkbox

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Gỡ `paymentService` khỏi Dashboard, Admin Panel, Báo cáo

**Files:**
- Modify: `src/pages/DashboardPage.jsx` (imports ~line 9, khối `Promise.all` ~line 47-55)
- Modify: `src/pages/AdminPanelPage.jsx` (~line 42-50)
- Modify: `src/pages/ReportsPage.jsx` (import ~line 16, `FeesReportCard` ~line 320-400)
- Delete: `src/services/paymentService.js`

**Interfaces:**
- Consumes: `feeService.buildFeesRows(year, month)` và `countFeeStudents` (Task 3, 4).
- Produces: không còn module nào trong `src/` import `paymentService`.

- [ ] **Step 1: DashboardPage**

Bỏ dòng import `paymentService`. Trong khối `Promise.all`, bỏ `paymentService.getByPeriod(period)` và bỏ state `monthlyRevenue` cùng thẻ hiển thị doanh thu tháng (thẻ này không còn nguồn dữ liệu). Khối `.then` rút còn:

```js
      .then(([feeRows]) => {
        const unpaidStudentIds = new Set(
          feeRows.filter(r => !r.paid).map(r => r.studentId)
        )
        setDebtCount(unpaidStudentIds.size)
      })
```

Nếu `period` chỉ còn phục vụ `paymentService`, xóa luôn biến đó. Xóa state `monthlyRevenue` và mọi chỗ dùng nó; grep để chắc chắn:

Run: `grep -n "monthlyRevenue\|period" src/pages/DashboardPage.jsx`
Expected: không còn dòng nào tham chiếu tới biến đã xóa.

- [ ] **Step 2: AdminPanelPage**

Đổi điều kiện đếm:

```js
      const unpaidStudentIds = new Set(
        feeRows.filter(r => !r.paid).map(r => r.studentId)
      )
```

(`feeService.buildFeesRows` vẫn được gọi như cũ; chỉ đổi điều kiện từ `r.paid < r.expected` sang `!r.paid`.)

- [ ] **Step 3: ReportsPage — viết lại FeesReportCard**

Bỏ import `paymentService`. Thay thân `FeesReportCard` bằng bản đếm người:

```jsx
const FeesReportCard = ({ classId }) => {
  const [fromMonth, setFromMonth] = useState(sixMonthsAgo())
  const [toMonth,   setToMonth]   = useState(currentMonth())
  const [loading,   setLoading]   = useState(false)
  const [chartData, setChartData] = useState(null)
  const [tableRows, setTableRows] = useState([])
  const [hasData,   setHasData]   = useState(false)
  const [months,    setMonths]    = useState([])
  const [monthRows, setMonthRows] = useState([])
  const [drillMonth, setDrillMonth] = useState(null)
  const [drillRows,  setDrillRows]  = useState([])

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      try {
        const ms = monthsBetween(fromMonth, toMonth)
        const perMonth = await Promise.all(ms.map(m => {
          const [y, mo] = m.split('-').map(Number)
          return feeService.buildFeesRows(y, mo)
        }))
        const scoped = perMonth.map(rows =>
          classId ? rows.filter(r => r.classId === classId) : rows
        )

        const paidCounts = scoped.map(rows => countFeeStudents(rows).paid)
        const debtCounts = scoped.map(rows => countFeeStudents(rows).debt)

        const labels = ms.map(fmtMonth)
        const rows = ms.map((m, i) => ({
          month: labels[i],
          paid: String(paidCounts[i]),
          debt: String(debtCounts[i]),
        }))

        setHasData(scoped.some(r => r.length > 0))
        setTableRows(rows)
        setMonths(ms)
        setMonthRows(scoped)
        setChartData({
          labels,
          datasets: [
            { label: 'Đã đóng',  data: paidCounts, backgroundColor: 'rgba(5,150,105,0.7)',  borderRadius: 6 },
            { label: 'Chưa đóng', data: debtCounts, backgroundColor: 'rgba(220,38,38,0.7)', borderRadius: 6 },
          ],
        })
      } catch { /* show empty */ }
      finally { setLoading(false) }
    }
    load()
  }, [classId, fromMonth, toMonth])

  const handleBarClick = (_, elements) => {
    if (!elements.length) return
    const idx = elements[0].index
    const rows = (monthRows[idx] ?? [])
      .filter(r => !r.paid)
      .map(r => ({ name: r.name, className: r.className, status: 'Chưa đóng' }))
    setDrillRows(rows)
    setDrillMonth(months[idx])
  }

  const excelCols = [
    { key: 'month', label: 'Tháng' },
    { key: 'paid',  label: 'Đã đóng' },
    { key: 'debt',  label: 'Chưa đóng' },
  ]

  // phần return JSX giữ nguyên cấu trúc cũ — xem các điểm cần đổi ở dưới
}
```

Giữ nguyên phần JSX `<ReportCard>` bên dưới, chỉ đổi:
- `title="Tổng thu Học phí"` → `title="Học phí"`
- thông báo rỗng `"Chưa có dữ liệu thanh toán"` → `"Chưa có dữ liệu học phí"`
- Modal drill-down: đổi cột từ (Học sinh / Số tiền / Ngày / Hình thức) sang (Học sinh / Lớp / Trạng thái), khớp với shape `drillRows` ở trên; tiêu đề modal đổi thành `Chưa đóng học phí — ${drillMonth}`.

Thêm import ở đầu file:

```js
import { countFeeStudents } from '@/utils/fees'
```

(`feeService` đã được import sẵn trong file — kiểm tra bằng grep, thêm nếu thiếu.)

- [ ] **Step 4: Xóa paymentService và xác nhận sạch**

```bash
git rm src/services/paymentService.js
```

Run: `grep -rn "paymentService" src/`
Expected: không có kết quả.

- [ ] **Step 5: Build để bắt import gãy**

Run: `npm run build`
Expected: build thành công, không có lỗi "failed to resolve import".

- [ ] **Step 6: Kiểm chứng bằng tay**

`npm run dev`:
1. Dashboard: thẻ "Chưa đóng phí" hiện số học sinh chưa đóng tháng hiện tại; click → sang trang Học phí.
2. Admin Panel: thẻ "HS chưa đóng phí" ra cùng con số.
3. Báo cáo → card Học phí: biểu đồ cột nhóm "Đã đóng / Chưa đóng" theo tháng; click một cột → modal liệt kê học sinh chưa đóng; xuất Excel + PDF chạy được.

- [ ] **Step 7: Commit**

```bash
git add -A src/pages/DashboardPage.jsx src/pages/AdminPanelPage.jsx src/pages/ReportsPage.jsx src/services/paymentService.js
git commit -m "refactor(fees): drop paymentService from dashboard, admin and reports

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Gỡ ô nhập học phí khỏi mọi form ghi danh

**Files:**
- Modify: `src/services/enrollmentService.js` (`fromDB` line 8-10, `toDB` line 29-31)
- Modify: `src/utils/enrollMany.js`
- Modify: `src/components/students/EnrollmentModal.jsx`
- Modify: `src/components/students/StudentEditModal.jsx`
- Modify: `src/components/students/BulkEnrollModal.jsx`
- Modify: `src/components/students/BulkEnrollPickerModal.jsx`
- Modify: `src/components/students/ImportStudentsModal.jsx`
- Modify: `src/pages/StudentsDirectoryPage.jsx` (line ~172-181)
- Delete: `src/components/students/BulkFeeModal.jsx`, `src/components/students/BulkFeeFields.jsx`

**Interfaces:**
- Consumes: `classes.monthly_fee` là nguồn phí duy nhất (Task 2).
- Produces: `enrollMany(studentIds, classId, config)` với `config = { goal, note }` (không còn field phí); object enrollment trả về từ `enrollmentService` không còn `feeType` / `monthlyFee` / `courseFee`.

- [ ] **Step 1: enrollmentService — bỏ 3 field phí**

Trong `src/services/enrollmentService.js`, xóa 3 dòng trong `fromDB`:

```js
  feeType: row.fee_type ?? 'monthly',
  monthlyFee: row.monthly_fee,
  courseFee: row.course_fee,
```

và 3 dòng trong `toDB`:

```js
  fee_type: data.feeType ?? 'monthly',
  monthly_fee: data.monthlyFee ?? null,
  course_fee: data.courseFee ?? null,
```

Cột DB vẫn tồn tại và nullable nên INSERT không kèm chúng vẫn hợp lệ.

- [ ] **Step 2: enrollMany — bỏ config phí**

Thay phần đầu `src/utils/enrollMany.js`:

```js
// config = { goal, note }
export async function enrollMany(studentIds, classId, config) {
  const { goal = '', note = '' } = config || {}
```

và trong object truyền cho `enrollmentService.upsert`, xóa 3 dòng `feeType` / `monthlyFee` / `courseFee`. Giữ nguyên phần `Promise.allSettled` và giá trị trả về.

- [ ] **Step 3: Xóa hai component phí dùng chung**

```bash
git rm src/components/students/BulkFeeModal.jsx src/components/students/BulkFeeFields.jsx
```

- [ ] **Step 4: Gỡ phí khỏi từng form**

Với mỗi file dưới đây: xóa state `feeType` / `monthlyFee` / `courseFee` (và `feeAmount` ở `ImportStudentsModal`), xóa khối JSX chọn "Theo tháng / Theo khóa" cùng ô nhập số tiền, xóa các field phí khỏi payload gửi đi, và xóa import `BulkFeeFields` nếu có:

- `src/components/students/EnrollmentModal.jsx` — xóa luôn component nội bộ `FeeInputs` (khai báo ~line 18) và hai chỗ render nó (~line 472, ~line 628); bỏ 4 field phí khỏi `EMPTY_NEW`; bỏ chúng khỏi cả 4 payload (`~line 172`, `~line 186`, `~line 208`, `~line 225`); xóa khối JSX phí ~line 336-370 và ~line 550-592.
- `src/components/students/StudentEditModal.jsx` — xóa state ~line 24-26, khối khởi tạo ~line 43-45, payload ~line 70-72, JSX ~line 200-245.
- `src/components/students/BulkEnrollModal.jsx` — xóa state ~line 15-17, sửa lời gọi `enrollMany` ~line 43 thành `{ goal, note }`, xóa `<BulkFeeFields …>` ~line 105-115.
- `src/components/students/BulkEnrollPickerModal.jsx` — xóa state ~line 20-22, sửa lời gọi `enrollMany` ~line 69 thành `{}`, xóa `<BulkFeeFields …>` ~line 152-162.
- `src/components/students/ImportStudentsModal.jsx` — xóa state `feeType` ~line 54 và biến `feeAmount`, xóa 3 field phí khỏi payload ~line 125-127, xóa khối JSX ~line 220-250.
- `src/pages/StudentsDirectoryPage.jsx` — xóa dòng tính `fee` ~line 172 và dòng hiển thị "Học phí tháng / Học phí khóa" ~line 180 trong sidebar chi tiết học sinh.

Sau khi sửa `StudentsDirectoryPage`, nếu "chế độ ghi danh" trước đây mở `BulkFeeModal` thì đổi thành gọi thẳng `enrollMany(selectedIds, classId, {})` rồi `toast.success('Đã ghi danh N học viên')` + refresh — không còn modal trung gian.

- [ ] **Step 5: Xác nhận không còn tham chiếu**

Run:
```bash
grep -rn "feeType\|monthlyFee\|courseFee\|BulkFeeFields\|BulkFeeModal" src/
```
Expected: chỉ còn `monthlyFee` trong `src/services/classService.js`, `src/services/feeService.js`, `src/components/classes/ClassModal.jsx`, `src/components/fees/FeesTable.jsx`, `src/pages/ClassesOverviewPage.jsx`, `src/utils/fees.js`, `scripts/test-fees.mjs`. Không còn `feeType`, `courseFee`, `BulkFeeFields`, `BulkFeeModal` ở bất kỳ đâu.

- [ ] **Step 6: Build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 7: Kiểm chứng bằng tay**

`npm run dev`, tài khoản admin:
1. Danh bạ học viên → "Thêm học sinh" → form không còn ô học phí; tạo được học sinh mới.
2. Chi tiết lớp → tab Học viên → "＋ Thêm" → chọn nhiều học sinh → ghi danh thành công, không hỏi học phí.
3. Danh bạ → chọn 1 lớp ở bộ lọc → chế độ ghi danh → tick vài học sinh → ghi danh thành công.
4. Import Excel học sinh vẫn chạy, không còn phần học phí.
5. Sidebar chi tiết học sinh không còn dòng học phí.
6. Trang Học phí vẫn hiện đúng các học sinh vừa ghi danh với mức phí của lớp.

- [ ] **Step 8: Commit**

```bash
git add -A src/
git commit -m "refactor(enrollment): remove per-student fee fields from all forms

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# Phần B — Nhiều giáo viên / 1 lớp

### Task 7: Migration nhiều giáo viên (schema + RLS)

**Files:**
- Create: `supabase/migrations/20260918000002_multi_teacher_per_class.sql`

**Interfaces:**
- Consumes: schema hiện có; các policy từ `20260602000001`, `20260625000001`, `20260625000002`, `20260710000001`.
- Produces: cột `schedule.teacher_id uuid null`; hàm `public.can_access_class(uuid) returns boolean`; policy mới trên `classes`, `sessions`, `enrollments`, `hw_assignments`, `attendance`, `homeworks`, `submissions`, `mock_test_results`, `reviews`, `session_reviews`, `general_comments`, `students`, `schedule`, `teacher_attendance`.

- [ ] **Step 1: Đọc policy hiện tại của reviews để giữ nguyên tên**

Run:
```bash
grep -n "reviews\|session_reviews\|general_comments" supabase/migrations/20260602000001_enable_rls_policies.sql
```
Ghi lại tên chính xác của các policy (dạng `"reviews: teacher insert"`) để drop đúng tên trong migration.

- [ ] **Step 2: Viết migration**

Tạo `supabase/migrations/20260918000002_multi_teacher_per_class.sql`:

```sql
-- =========================================================================
-- Migration: Nhiều giáo viên trong một lớp, chia theo ca
-- Change: multi-teacher-per-class
--
-- Một lớp có thể chia buổi giữa nhiều giáo viên (T2 cô A, T4 cô B). Mỗi ca
-- trong bảng `schedule` thuộc về ĐÚNG MỘT giáo viên.
--
--   schedule.teacher_id = null  → GV phụ trách lớp (classes.teacher_id) dạy ca đó
--   schedule.teacher_id = <uid> → giáo viên đó dạy ca đó
--
-- Quyền truy cập lớp vì vậy không còn là `classes.teacher_id = auth.uid()` mà
-- là `can_access_class(class_id)`: GV phụ trách HOẶC có ít nhất một ca trong lớp.
--
-- Rollback:
--   drop toàn bộ policy tạo ở đây, re-create bản cũ (nội dung gốc ở
--   20260602000001, 20260625000001, 20260625000002, 20260710000001), rồi:
--   drop function if exists public.can_access_class(uuid);
--   alter table public.schedule drop column if exists teacher_id;
-- =========================================================================

alter table public.schedule
  add column if not exists teacher_id uuid references public.teachers(id) on delete set null;

comment on column public.schedule.teacher_id is
  'Giáo viên dạy ca này. NULL = giáo viên phụ trách lớp (classes.teacher_id).';

create index if not exists schedule_teacher_id_idx on public.schedule (teacher_id);

-- -------------------------------------------------------------------------
-- Helper: một giáo viên truy cập được lớp nếu phụ trách lớp hoặc có ca trong lớp.
-- -------------------------------------------------------------------------
create or replace function public.can_access_class(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or exists (
        select 1 from public.classes c
        where c.id = cid and c.teacher_id = auth.uid()
      )
      or exists (
        select 1 from public.schedule s
        where s.class_id = cid and s.teacher_id = auth.uid()
      );
$$;

grant execute on function public.can_access_class(uuid) to authenticated;

-- -------------------------------------------------------------------------
-- classes — SELECT mở cho GV có ca trong lớp. Write vẫn chỉ admin + GV phụ trách.
-- -------------------------------------------------------------------------
drop policy if exists "classes: teacher or admin select" on public.classes;
create policy "classes: teacher or admin select"
  on public.classes for select
  using (can_access_class(id));

-- -------------------------------------------------------------------------
-- Bảng con khóa theo class_id: enrollments, sessions, hw_assignments,
-- reviews, session_reviews, general_comments.
-- -------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'enrollments', 'sessions', 'hw_assignments',
    'reviews', 'session_reviews', 'general_comments'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || ': teacher or admin select', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher insert', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher update', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher delete', t);

    execute format(
      'create policy %I on public.%I for select using (can_access_class(class_id))',
      t || ': teacher or admin select', t);
    execute format(
      'create policy %I on public.%I for insert with check (can_access_class(class_id))',
      t || ': teacher insert', t);
    execute format(
      'create policy %I on public.%I for update using (can_access_class(class_id)) with check (can_access_class(class_id))',
      t || ': teacher update', t);
    execute format(
      'create policy %I on public.%I for delete using (can_access_class(class_id))',
      t || ': teacher delete', t);
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- attendance & homeworks (qua sessions.class_id)
-- -------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['attendance', 'homeworks']
  loop
    execute format('drop policy if exists %I on public.%I', t || ': teacher or admin select', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher insert', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher update', t);
    execute format('drop policy if exists %I on public.%I', t || ': teacher delete', t);

    execute format(
      'create policy %I on public.%I for select using (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher or admin select', t);
    execute format(
      'create policy %I on public.%I for insert with check (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher insert', t);
    execute format(
      'create policy %I on public.%I for update using (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id))) with check (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher update', t);
    execute format(
      'create policy %I on public.%I for delete using (exists (select 1 from public.sessions s where s.id = session_id and can_access_class(s.class_id)))',
      t || ': teacher delete', t);
  end loop;
end $$;

-- -------------------------------------------------------------------------
-- submissions (qua hw_assignments.class_id)
-- -------------------------------------------------------------------------
drop policy if exists "submissions: teacher or admin select" on public.submissions;
drop policy if exists "submissions: teacher insert" on public.submissions;
drop policy if exists "submissions: teacher update" on public.submissions;
drop policy if exists "submissions: teacher delete" on public.submissions;

create policy "submissions: teacher or admin select"
  on public.submissions for select
  using (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

create policy "submissions: teacher insert"
  on public.submissions for insert
  with check (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

create policy "submissions: teacher update"
  on public.submissions for update
  using      (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)))
  with check (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

create policy "submissions: teacher delete"
  on public.submissions for delete
  using (exists (select 1 from public.hw_assignments h where h.id = hw_assignment_id and can_access_class(h.class_id)));

-- -------------------------------------------------------------------------
-- mock_test_results (qua mock_tests.class_id)
-- -------------------------------------------------------------------------
drop policy if exists "mock_test_results: teacher or admin select" on public.mock_test_results;
drop policy if exists "mock_test_results: teacher insert" on public.mock_test_results;
drop policy if exists "mock_test_results: teacher update" on public.mock_test_results;
drop policy if exists "mock_test_results: teacher delete" on public.mock_test_results;

create policy "mock_test_results: teacher or admin select"
  on public.mock_test_results for select
  using (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

create policy "mock_test_results: teacher insert"
  on public.mock_test_results for insert
  with check (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

create policy "mock_test_results: teacher update"
  on public.mock_test_results for update
  using      (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)))
  with check (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

create policy "mock_test_results: teacher delete"
  on public.mock_test_results for delete
  using (exists (select 1 from public.mock_tests m where m.id = mock_test_id and can_access_class(m.class_id)));

-- -------------------------------------------------------------------------
-- students — GV đọc được học sinh trong lớp mình dạy (kể cả lớp chia ca).
-- -------------------------------------------------------------------------
drop policy if exists "students: teacher or admin select" on public.students;
create policy "students: teacher or admin select"
  on public.students for select
  using (
    teacher_id = auth.uid()
    or is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.student_id = students.id and can_access_class(e.class_id)
    )
  );

-- -------------------------------------------------------------------------
-- schedule — GV đọc ca của lớp mình truy cập được; ghi chỉ admin (lịch được
-- sinh tự động từ ClassModal, vốn là màn hình admin).
-- -------------------------------------------------------------------------
drop policy if exists "schedule: teacher or admin select" on public.schedule;
drop policy if exists "schedule: teacher insert" on public.schedule;
drop policy if exists "schedule: teacher update" on public.schedule;
drop policy if exists "schedule: teacher delete" on public.schedule;

create policy "schedule: teacher or admin select"
  on public.schedule for select
  using (teacher_id = auth.uid() or can_access_class(class_id));

create policy "schedule: admin insert"
  on public.schedule for insert
  with check (is_admin());

create policy "schedule: admin update"
  on public.schedule for update
  using (is_admin()) with check (is_admin());

create policy "schedule: admin delete"
  on public.schedule for delete
  using (is_admin());

-- -------------------------------------------------------------------------
-- teacher_attendance — GV tự chấm công ca CỦA MÌNH (theo schedule.teacher_id,
-- fallback classes.teacher_id khi ca chưa gán GV riêng).
-- -------------------------------------------------------------------------
drop policy if exists "teacher_attendance: teacher self insert" on public.teacher_attendance;
create policy "teacher_attendance: teacher self insert"
  on public.teacher_attendance for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.schedule s
      join public.classes c on c.id = s.class_id
      where s.id = schedule_id
        and coalesce(s.teacher_id, c.teacher_id) = auth.uid()
    )
  );
```

Các policy `teacher_attendance: teacher self update/delete` và `substitute confirm update` khóa theo `teacher_id = auth.uid()` / `substitute_teacher_id = auth.uid()` — không phụ thuộc lớp nên giữ nguyên, không đụng tới.

- [ ] **Step 3: Chạy migration**

Mở **Supabase SQL Editor**, dán toàn bộ file, Run.
Expected: không lỗi. Nếu một `drop policy` báo tên không tồn tại, lấy tên đúng từ Step 1 rồi sửa lại — mọi `drop` đều có `if exists` nên lỗi chỉ đến từ `create policy` trùng tên.

- [ ] **Step 4: Kiểm chứng hàm helper bằng SQL**

Chạy trong SQL Editor (chạy với quyền service role nên `is_admin()` có thể trả false — chỉ cần hàm tồn tại và chạy được):

```sql
select proname from pg_proc where proname = 'can_access_class';
select count(*) from public.schedule where teacher_id is null;
```

Expected: dòng đầu trả `can_access_class`; dòng sau trả tổng số ca hiện có (mọi ca đang là `null`, đúng nghĩa cũ).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260918000002_multi_teacher_per_class.sql
git commit -m "feat(db): allow multiple teachers per class via schedule.teacher_id

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Lương theo giáo viên của từng ca

**Files:**
- Modify: `src/utils/payroll.js` (`buildPayrollRows`, khối `scheduleTeacher` ~line 28-31)
- Create: `scripts/test-payroll.mjs`

**Interfaces:**
- Consumes: `schedule` items có thêm field `teacherId` (Task 9 sẽ map nó từ DB; test dùng dữ liệu dựng sẵn).
- Produces: `buildPayrollRows({ year, month, teachers, classes, schedule, attendance })` — `schedule` item nay là `{ id, classId, dayOfWeek, teacherId? }`; `teacherId` rỗng thì quy về `classes[].teacherId`.

- [ ] **Step 1: Viết test trước**

Tạo `scripts/test-payroll.mjs`:

```js
import assert from 'node:assert/strict'
import { buildPayrollRows, countWeekdayOccurrences } from '../src/utils/payroll.js'

let passed = 0
const test = (name, fn) => { fn(); passed++; console.log('  ✓', name) }

const teachers = [
  { id: 'tA', name: 'Cô A', email: 'a@x.vn', sessionRate: 100 },
  { id: 'tB', name: 'Cô B', email: 'b@x.vn', sessionRate: 200 },
]
const classes = [{ id: 'c1', teacherId: 'tA' }]

// Tháng 6/2026: T2 (dayOfWeek 1) và T4 (dayOfWeek 3).
const mondays   = countWeekdayOccurrences(2026, 6, 1)
const wednesdays = countWeekdayOccurrences(2026, 6, 3)

test('ca không gán GV thì quy về GV phụ trách lớp', () => {
  const schedule = [{ id: 's1', classId: 'c1', dayOfWeek: 1 }]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance: [] })
  const a = rows.find(r => r.teacherId === 'tA')
  const b = rows.find(r => r.teacherId === 'tB')
  assert.equal(a.scheduled, mondays)
  assert.equal(b.scheduled, 0)
})

test('ca gán GV khác thì scheduled chuyển sang GV đó', () => {
  const schedule = [
    { id: 's1', classId: 'c1', dayOfWeek: 1, teacherId: null },
    { id: 's2', classId: 'c1', dayOfWeek: 3, teacherId: 'tB' },
  ]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance: [] })
  assert.equal(rows.find(r => r.teacherId === 'tA').scheduled, mondays)
  assert.equal(rows.find(r => r.teacherId === 'tB').scheduled, wednesdays)
})

test('lương vẫn tính theo số buổi đã xác nhận dạy, không theo scheduled', () => {
  const schedule = [{ id: 's2', classId: 'c1', dayOfWeek: 3, teacherId: 'tB' }]
  const attendance = [
    { scheduleId: 's2', teacherId: 'tB', status: 'present' },
    { scheduleId: 's2', teacherId: 'tB', status: 'present' },
  ]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance })
  const b = rows.find(r => r.teacherId === 'tB')
  assert.equal(b.taught, 2)
  assert.equal(b.actualPay, 400)
})

test('buổi dạy thay đã xác nhận tính cho người dạy thay', () => {
  const schedule = [{ id: 's1', classId: 'c1', dayOfWeek: 1 }]
  const attendance = [
    { scheduleId: 's1', teacherId: 'tA', status: 'absent', substituteTeacherId: 'tB', substituteConfirmed: true },
  ]
  const rows = buildPayrollRows({ year: 2026, month: 6, teachers, classes, schedule, attendance })
  assert.equal(rows.find(r => r.teacherId === 'tA').actualPay, 0)
  assert.equal(rows.find(r => r.teacherId === 'tB').actualPay, 200)
})

console.log(`\n${passed} test đã pass.`)
```

- [ ] **Step 2: Chạy test để xem cái nào fail**

Run: `node scripts/test-payroll.mjs`
Expected: test 1, 3, 4 PASS; test 2 **FAIL** — `tB.scheduled` trả 0 vì `scheduleTeacher` đang luôn lấy GV của lớp.

- [ ] **Step 3: Sửa payroll.js**

Trong `src/utils/payroll.js`, thay khối:

```js
  // scheduleId -> teacherId phụ trách (qua lớp)
  const scheduleTeacher = new Map(
    schedule.map(s => [s.id, classTeacher.get(s.classId) ?? null])
  )
```

bằng:

```js
  // scheduleId -> teacherId dạy ca đó. schedule.teacherId rỗng = GV phụ trách lớp.
  const scheduleTeacher = new Map(
    schedule.map(s => [s.id, s.teacherId ?? classTeacher.get(s.classId) ?? null])
  )
```

Cập nhật comment mô tả shape ở đầu hàm:

```js
// schedule: [{ id, classId, dayOfWeek, teacherId }]  (teacherId null = GV phụ trách lớp)
```

- [ ] **Step 4: Chạy lại test**

Run: `node scripts/test-payroll.mjs`
Expected: PASS — `4 test đã pass.`

- [ ] **Step 5: Commit**

```bash
git add src/utils/payroll.js scripts/test-payroll.mjs
git commit -m "fix(payroll): count scheduled sessions per slot teacher

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: Gán giáo viên cho từng ca (service + ClassModal)

**Files:**
- Modify: `src/services/scheduleService.js` (`fromDB`, `toDB`, `syncForClass`)
- Modify: `src/services/classService.js` (`create` ~line 124, `update` ~line 146)
- Modify: `src/components/classes/ClassModal.jsx`

**Interfaces:**
- Consumes: `schedule.teacher_id` (Task 7); `teachers` prop mà `ClassModal` đã nhận sẵn (`[{ id, name, email }]`).
- Produces:
  - `scheduleService` items có field `teacherId` (string | null).
  - `scheduleService.syncForClass(classId, { dayList, startTime, endTime, room, teacherByDay })` — `teacherByDay` là `{ [dayOfWeek: number]: string }`; `''` hoặc thiếu key = để `null` (GV phụ trách lớp). Bỏ qua `teacher_id` hoàn toàn khi `teacherByDay === undefined`.
  - `ClassModal` gửi `teacherByDay` trong payload `onSave`; `classService.create/update` chuyển tiếp xuống `syncForClass`.

- [ ] **Step 1: scheduleService — map teacherId**

Trong `src/services/scheduleService.js`, thêm vào `fromDB` (sau `note: row.note,`):

```js
  teacherId: row.teacher_id ?? null,
```

Thêm vào `toDB` (sau `note: data.note ?? null,`):

```js
  teacher_id: data.teacherId || null,
```

- [ ] **Step 2: scheduleService — syncForClass nhận teacherByDay**

Thay chữ ký và hai nhánh upsert trong `syncForClass`:

```js
  async syncForClass(classId, { dayList, startTime, endTime, room, teacherByDay }) {
    if (!classId || !Array.isArray(dayList) || dayList.length === 0 || !startTime || !endTime) return
    const wanted = new Set(dayList.map(Number))

    const { data: existing, error: selErr } = await supabase
      .from('schedule')
      .select('id, day_of_week, note')
      .eq('class_id', classId)
    if (selErr) throw new Error(selErr.message)

    const existingByDay = new Map((existing ?? []).map(r => [r.day_of_week, r]))

    for (const day of wanted) {
      const found = existingByDay.get(day)
      const patch = { start_time: startTime, end_time: endTime, room: room ?? null }
      // teacherByDay undefined = caller không quản GV theo ca → giữ nguyên teacher_id cũ.
      if (teacherByDay !== undefined) patch.teacher_id = teacherByDay?.[day] || null

      if (found) {
        const { error } = await supabase.from('schedule').update(patch).eq('id', found.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase
          .from('schedule')
          .insert({ class_id: classId, day_of_week: day, note: null, ...patch })
        if (error) throw new Error(error.message)
      }
    }

    const toDelete = (existing ?? []).filter(r => !wanted.has(r.day_of_week)).map(r => r.id)
    if (toDelete.length > 0) {
      const { error } = await supabase.from('schedule').delete().in('id', toDelete)
      if (error) throw new Error(error.message)
    }
  },
```

- [ ] **Step 3: classService chuyển tiếp teacherByDay**

Trong `src/services/classService.js`, ở cả `create` và `update`, thêm `teacherByDay: data.teacherByDay,` vào object truyền cho `scheduleService.syncForClass`:

```js
      await scheduleService.syncForClass(row.id, {
        dayList: data.scheduleDayList,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        teacherByDay: data.teacherByDay,
      })
```

(trong `update` thì tham số đầu là `id` thay vì `row.id`). `teacherByDay` không nằm trong `toDB` nên không ảnh hưởng payload của bảng `classes`.

- [ ] **Step 4: ClassModal — dropdown GV cho từng thứ đã chọn**

Trong `src/components/classes/ClassModal.jsx`:

Thêm state:

```js
  const [teacherByDay, setTeacherByDay] = useState({})
```

Trong `useEffect`, nhánh `if (classItem)` nạp từ prop mới `scheduleItems` (danh sách ca của lớp, xem Step 5):

```js
        const byDay = {}
        for (const s of scheduleItems) {
          if (s.classId === classItem.id) byDay[s.dayOfWeek] = s.teacherId || ''
        }
        setTeacherByDay(byDay)
```

nhánh `else`: `setTeacherByDay({})`.

Trong `toggleDay`, khi bỏ chọn một thứ thì xóa luôn entry tương ứng:

```js
  const toggleDay = (d) => {
    setFormData(prev => ({
      ...prev,
      scheduleDayList: prev.scheduleDayList.includes(d)
        ? prev.scheduleDayList.filter(x => x !== d)
        : [...prev.scheduleDayList, d],
    }))
    setTeacherByDay(prev => {
      const next = { ...prev }
      if (d in next) delete next[d]
      return next
    })
  }
```

Thêm khối JSX ngay dưới nhóm nút T2…CN (chỉ admin, chỉ khi đã chọn ít nhất một thứ):

```jsx
        {isAdmin && formData.scheduleDayList.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-navy-700">Giáo viên theo buổi</label>
            {[...formData.scheduleDayList]
              .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
              .map(day => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-sm font-medium text-navy-700">
                    {DAY_OPTIONS.find(d => d.value === day)?.label}
                  </span>
                  <select
                    value={teacherByDay[day] ?? ''}
                    onChange={e => setTeacherByDay(prev => ({ ...prev, [day]: e.target.value }))}
                    className="select flex-1"
                  >
                    <option value="">Giáo viên phụ trách</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name || t.email}</option>
                    ))}
                  </select>
                </div>
              ))}
            <p className="text-xs text-navy-500">
              Để trống nghĩa là giáo viên phụ trách lớp dạy buổi đó.
            </p>
          </div>
        )}
```

Trong `handleSubmit`, thêm cảnh báo mất quyền trước khi gọi `onSave`:

```js
    // Bỏ một thứ sẽ xóa ca đó. GV chỉ dạy đúng ca bị xóa sẽ mất quyền vào lớp.
    const keptDays = new Set(formData.scheduleDayList)
    const orphaned = scheduleItems
      .filter(s => classItem && s.classId === classItem.id && s.teacherId && !keptDays.has(s.dayOfWeek))
      .filter(s => s.teacherId !== (classItem?.teacherId ?? formData.teacherId))
      .filter(s => !formData.scheduleDayList.some(d => (teacherByDay[d] || '') === s.teacherId))

    if (orphaned.length > 0) {
      const names = [...new Set(orphaned.map(s =>
        teachers.find(t => t.id === s.teacherId)?.name || 'Giáo viên'
      ))].join(', ')
      if (!window.confirm(`Bỏ buổi này sẽ khiến ${names} không còn truy cập được lớp. Tiếp tục?`)) return
    }
```

và thêm `teacherByDay` vào payload:

```js
    onSave({
      ...formData,
      maxStudents: Number(formData.maxStudents) || 0,
      skillConfig: toSkillConfig(skillSections),
      teacherByDay,
    })
```

Thêm prop `scheduleItems = []` vào chữ ký component:

```js
export const ClassModal = ({ open, onClose, classItem = null, onSave, isAdmin = false, teachers = [], scheduleItems = [] }) => {
```

- [ ] **Step 5: Truyền `scheduleItems` vào ClassModal**

Tìm mọi nơi render `<ClassModal`:

Run: `grep -rn "<ClassModal" src/`

Ở mỗi nơi: load lịch bằng `scheduleService.getAll()` (cùng chỗ đang load `classService.getAll()` / `teacherService.getAll()`), giữ trong state `scheduleItems`, rồi truyền `scheduleItems={scheduleItems}`. Nếu trang đó chưa load teachers thì cũng chưa cần — prop `teachers` đã có sẵn ở các trang admin.

- [ ] **Step 6: Kiểm chứng bằng tay**

`npm run dev`, tài khoản admin:
1. Sửa một lớp đang học T2 + T4 → thấy 2 dropdown "T2", "T4", cả hai đang là "Giáo viên phụ trách".
2. Đặt T4 = cô B → Lưu → mở lại lớp → T4 vẫn là cô B, T2 vẫn là "Giáo viên phụ trách".
3. Bỏ chọn T4 → hiện confirm "Bỏ buổi này sẽ khiến Cô B không còn truy cập được lớp." → Hủy thì không lưu; OK thì lưu và ca T4 biến mất.
4. Sửa lại giờ học của lớp (không đụng dropdown GV) → Lưu → việc gán cô B ở T4 vẫn còn.
5. Kiểm tra DB: `select day_of_week, teacher_id from schedule where class_id = '<id lớp>';` — T4 có `teacher_id` của cô B.

- [ ] **Step 7: Commit**

```bash
git add src/services/scheduleService.js src/services/classService.js src/components/classes/ClassModal.jsx src/pages/
git commit -m "feat(schedule): assign a teacher to each weekly slot

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Lịch dạy và chấm công theo giáo viên của ca

**Files:**
- Modify: `src/pages/SchedulePage.jsx` (`visibleClasses` ~line 128, `visibleSchedule` ~line 136, `handleToggleAttendance` ~line 203)
- Modify: `src/components/schedule/WeeklyGrid.jsx` (chữ ký ~line 29)
- Modify: `src/components/schedule/ScheduleCard.jsx` (khối `showTeacher` ~line 146)
- Modify: `src/pages/ClassDetailPage/index.jsx` (header lớp)

**Interfaces:**
- Consumes: `schedule` items có `teacherId` (Task 9); `teachers` đã load sẵn trong `SchedulePage` khi là admin.
- Produces: `ScheduleCard` nhận thêm prop `slotTeacherName` (string | null) và hiển thị nó trên dòng riêng; `WeeklyGrid` nhận thêm prop `slotTeacherName` qua map `teacherNameById`.

- [ ] **Step 1: Chấm công ghi đúng giáo viên của ca**

Trong `src/pages/SchedulePage.jsx`, `handleToggleAttendance`, thay:

```js
    const cls = classes.find(c => c.id === item.classId)
    if (!cls?.teacherId) { toast.error('Không tìm thấy lớp/giáo viên'); return }
```

bằng:

```js
    const cls = classes.find(c => c.id === item.classId)
    // Công buổi thuộc về GV của CA đó; ca chưa gán riêng thì thuộc GV phụ trách lớp.
    const slotTeacherId = item.teacherId ?? cls?.teacherId
    if (!slotTeacherId) { toast.error('Không tìm thấy lớp/giáo viên'); return }
```

rồi thay cả 2 chỗ `teacherId: cls.teacherId` trong hàm bằng `teacherId: slotTeacherId`.

- [ ] **Step 2: Bộ lọc giáo viên của admin tính cả ca được gán**

Thay `visibleClasses` / `visibleSchedule`:

```js
  // Lớp "của" một GV = lớp họ phụ trách HOẶC lớp họ có ít nhất một ca.
  const visibleClasses = useMemo(() => {
    if (!isAdmin || !selectedTeacherId) return classes
    const classIdsFromSlots = new Set(
      schedule.filter(s => s.teacherId === selectedTeacherId).map(s => s.classId)
    )
    return classes.filter(c => c.teacherId === selectedTeacherId || classIdsFromSlots.has(c.id))
  }, [classes, schedule, isAdmin, selectedTeacherId])

  const visibleClassIds = useMemo(() => new Set(visibleClasses.map(c => c.id)), [visibleClasses])

  // Chỉ hiện những ca mà GV đang lọc thực sự dạy.
  const visibleSchedule = useMemo(() => {
    if (!isAdmin || !selectedTeacherId) return schedule
    return schedule.filter(s => {
      if (!visibleClassIds.has(s.classId)) return false
      const cls = classes.find(c => c.id === s.classId)
      return (s.teacherId ?? cls?.teacherId) === selectedTeacherId
    })
  }, [schedule, classes, isAdmin, selectedTeacherId, visibleClassIds])
```

- [ ] **Step 3: Dựng map tên GV và truyền xuống lưới**

Thêm ngay dưới `attendanceMap` trong `SchedulePage`:

```js
  // Tên GV của từng ca — chỉ hiện khi lớp có từ 2 GV trở lên (tránh nhiễu).
  const slotTeacherNames = useMemo(() => {
    const byId = new Map(teachers.map(t => [t.id, t.name || t.email]))
    const teachersPerClass = new Map()
    for (const s of schedule) {
      const cls = classes.find(c => c.id === s.classId)
      const tid = s.teacherId ?? cls?.teacherId
      if (!tid) continue
      if (!teachersPerClass.has(s.classId)) teachersPerClass.set(s.classId, new Set())
      teachersPerClass.get(s.classId).add(tid)
    }
    const map = new Map()
    for (const s of schedule) {
      if ((teachersPerClass.get(s.classId)?.size ?? 0) < 2) continue
      const cls = classes.find(c => c.id === s.classId)
      const tid = s.teacherId ?? cls?.teacherId
      const name = byId.get(tid) ?? (tid === cls?.teacherId ? cls?.teacherName : null)
      if (name) map.set(s.id, name)
    }
    return map
  }, [schedule, classes, teachers])
```

Truyền vào `<WeeklyGrid ... slotTeacherNames={slotTeacherNames} />`.

- [ ] **Step 4: WeeklyGrid chuyển tiếp xuống card**

Thêm `slotTeacherNames = new Map()` vào chữ ký `WeeklyGrid`, và ở chỗ render `<ScheduleCard ... />` truyền thêm:

```jsx
              slotTeacherName={slotTeacherNames.get(item.id) ?? null}
```

- [ ] **Step 5: ScheduleCard hiện tên GV của ca**

Trong `src/components/schedule/ScheduleCard.jsx`, thêm `slotTeacherName = null` vào props của `ScheduleCard`, rồi thay khối:

```jsx
      {showTeacher && cls?.teacherName && (
        <div className={clsx('text-xs mb-1 truncate opacity-70', color.text)}>
          {cls.teacherName}
        </div>
      )}
```

bằng:

```jsx
      {(slotTeacherName || (showTeacher && cls?.teacherName)) && (
        <div
          className={clsx('text-xs mb-1 truncate opacity-70', color.text)}
          title={slotTeacherName || cls?.teacherName}
        >
          {slotTeacherName || cls?.teacherName}
        </div>
      )}
```

- [ ] **Step 6: ClassDetailPage liệt kê giáo viên của lớp**

Trong `src/pages/ClassDetailPage/index.jsx`, thêm state và mở rộng `loadHeader` (hàm này đã tồn tại, ~line 25):

```js
  const [classSchedule, setClassSchedule] = useState([])
  const [teachers, setTeachers] = useState([])
```

```js
  const loadHeader = async () => {
    try {
      const requests = [
        classService.getById(classId),
        enrollmentService.getByClass(classId),
        scheduleService.getAll(),
      ]
      // Policy SELECT của bảng teachers chỉ cho GV thường thấy chính họ,
      // nên chỉ admin mới load được danh sách tên đầy đủ.
      if (isAdmin) requests.push(teacherService.getAll())
      const [cls, enrollments, allSchedule, allTeachers] = await Promise.all(requests)
      setCurrentClass(cls)
      setStudentCount(enrollments.filter(e => e.status === 'active').length)
      setClassSchedule(allSchedule.filter(s => s.classId === classId))
      if (allTeachers) setTeachers(allTeachers)
    } catch {
      setCurrentClass(null)
    } finally {
      setLoading(false)
    }
  }
```

Thêm import:

```js
import { useMemo } from 'react'
import { scheduleService } from '@/services/scheduleService'
import { teacherService } from '@/services/classService'
import { fmtDayList } from '@/utils/helpers'
```

(`useMemo` gộp vào dòng import `react` đã có; `teacherService` được export từ `classService.js`.)

Render dưới tên lớp ở header:

```jsx
      {classTeacherLines.length > 1 && (
        <div className="text-sm text-navy-500">
          {classTeacherLines.map(line => (
            <div key={line.teacherId}>
              {line.name} · {fmtDayList(line.days)}
            </div>
          ))}
        </div>
      )}
```

với:

```js
  const classTeacherLines = useMemo(() => {
    const byTeacher = new Map()
    for (const s of classSchedule) {
      const tid = s.teacherId ?? currentClass?.teacherId
      if (!tid) continue
      if (!byTeacher.has(tid)) byTeacher.set(tid, { teacherId: tid, name: null, days: [] })
      byTeacher.get(tid).days.push(s.dayOfWeek)
    }
    for (const entry of byTeacher.values()) {
      entry.name = teachers.find(t => t.id === entry.teacherId)?.name
        || (entry.teacherId === currentClass?.teacherId ? currentClass?.teacherName : null)
        || 'Giáo viên'
    }
    return [...byTeacher.values()]
  }, [classSchedule, currentClass, teachers])
```

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: build thành công.

- [ ] **Step 8: Kiểm chứng bằng tay — đây là phần dễ vỡ nhất**

Chuẩn bị: một lớp của cô A, ca T4 gán cho cô B (làm ở Task 9).

Tài khoản **admin**:
1. Giảng dạy → Lịch dạy: lớp hiện ở cả T2 và T4; card T2 ghi "Cô A", card T4 ghi "Cô B".
2. Lọc theo cô B → chỉ còn card T4.
3. Tick "Đã dạy" trên card T4 → kiểm tra DB: `select teacher_id from teacher_attendance where schedule_id = '<id ca T4>';` phải trả **id của cô B**, không phải cô A.
4. Tab Bảng lương tháng đó: cột "Lịch dạy" của cô A không tính T4; của cô B đếm đúng số ngày T4 trong tháng.

Tài khoản **cô B** (giáo viên thường):
5. Thấy lớp trong danh sách Lớp học, mở được Chi tiết lớp.
6. Tab Điểm danh: tạo buổi và **lưu điểm danh thành công** (nếu RLS sai sẽ báo `new row violates row-level security policy`).
7. Tab Bài tập: giao bài + chấm bài thành công.
8. Tab Mock Test: nhập điểm thành công.
9. Giảng dạy → thấy ca T4 và tick "Đã dạy" được; **không** thấy/không tick được ca T2.
10. Header Chi tiết lớp liệt kê cả "Cô A · T2" và "Cô B · T4".

- [ ] **Step 9: Commit**

```bash
git add src/pages/SchedulePage.jsx src/components/schedule/WeeklyGrid.jsx src/components/schedule/ScheduleCard.jsx src/pages/ClassDetailPage/index.jsx
git commit -m "feat(schedule): attribute attendance and payroll to the slot teacher

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Đồng bộ seed data và tài liệu

**Files:**
- Modify: `supabase/seed/seed_mock_data.sql`
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: schema sau cả hai migration.
- Produces: seed chạy lại được trên DB mới; `CLAUDE.md` khớp code.

- [ ] **Step 1: Cập nhật seed — học phí**

Trong `supabase/seed/seed_mock_data.sql`:
- Bước tạo `classes` (tìm `INSERT INTO public.classes`): thêm cột `monthly_fee` với giá trị thật cho từng lớp (VD 1200000, 1500000).
- Bước 5 `enrollments` (~line 242): bỏ 3 cột `fee_type`, `monthly_fee`, `course_fee` khỏi danh sách cột và khỏi mọi dòng VALUES.
- Bước 12 `fees` (~line 725): bỏ cột `surcharge`, giữ `paid` với mix true/false.
- Bước `payments` (~line 787): **xóa toàn bộ khối INSERT** cùng dòng đếm `payments` ở phần verify (~line 1168) và dòng tương ứng trong bảng tổng kết ở cuối file (~line 1196).
- Phần cleanup ở đầu file: giữ nguyên lệnh xóa `payments` (dữ liệu cũ vẫn cần dọn).

- [ ] **Step 2: Cập nhật seed — lịch dạy nhiều GV**

Ở `INSERT INTO public.schedule` (~line 228): thêm cột `teacher_id`, để `NULL` cho phần lớn ca, và gán **một** ca của một lớp cho giáo viên mock thứ hai (`t2` trong CTE `_seed_teachers`) để bộ seed thể hiện được tính năng chia ca.

- [ ] **Step 3: Chạy lại seed để kiểm chứng**

Dán toàn bộ `seed_mock_data.sql` vào Supabase SQL Editor và Run.
Expected: chạy xong không lỗi; bảng verify ở cuối in ra số dòng từng bảng, không còn dòng `payments`.

- [ ] **Step 4: Cập nhật CLAUDE.md**

Sửa các mục sau cho khớp code:
- **"Model học phí (đã chốt)"** — viết lại: mức phí cố định ở `classes.monthly_fee`; `fees.paid` là trạng thái nhị phân duy nhất; `enrollments.fee_type/monthly_fee/course_fee`, `fees.surcharge`, bảng `payments` và `paymentService` đã orphan/bị xóa; `feeService` chỉ còn `buildFeesRows` + `setPaid`; logic thuần ở `src/utils/fees.js` (test `node scripts/test-fees.mjs`).
- **Danh sách services** ở mục "Data Layer" — bỏ `paymentService`.
- **"Routing & Layout"**, phần FeesPage — bỏ mô tả tab "Đóng một phần" và các thẻ tiền; mô tả 3 tab mới + 2 thẻ đếm người.
- **Mục mới "Model nhiều giáo viên / lớp"** — `schedule.teacher_id` (null = GV phụ trách lớp), hàm `can_access_class(uuid)` là khóa phân quyền mới, migration `20260918000002`, cách rollback, và lưu ý chấm công ghi theo GV của ca.
- **"Mô hình lương giáo viên"** — `scheduled` nay đếm theo GV của từng ca; test `node scripts/test-payroll.mjs`.
- **"Quyết định kiến trúc đã chốt"** — thêm dòng về `can_access_class` thay cho `classes.teacher_id = auth.uid()`.
- **"Mock Seed Data"** — ghi rõ seed nay có `classes.monthly_fee` và một ca gán GV thứ hai.

- [ ] **Step 5: Cập nhật README.md**

Tìm phần mô tả tính năng học phí và lịch dạy, sửa cho khớp: học phí là tick theo tháng với mức cố định của lớp; một lớp có thể chia buổi cho nhiều giáo viên.

- [ ] **Step 6: Chạy lại toàn bộ test và build**

Run:
```bash
node scripts/test-fees.mjs && node scripts/test-payroll.mjs && node scripts/test-curriculum-parser.mjs && npm run build
```
Expected: cả ba script in số test đã pass, `npm run build` thành công.

- [ ] **Step 7: Commit**

```bash
git add supabase/seed/seed_mock_data.sql CLAUDE.md README.md
git commit -m "docs: sync seed data and docs with fee and multi-teacher changes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Ghi chú khi thực thi

- **Thứ tự bắt buộc:** Task 1 trước mọi task Phần A; Task 7 trước Task 9 và 10. Task 8 (payroll thuần) chạy độc lập được, nhưng kết quả chỉ thấy trên UI sau Task 9.
- **Migration chạy tay trong Supabase SQL Editor** — repo không có CLI migration runner. Chạy trên môi trường dev trước, production theo `DEPLOYMENT.md`.
- **Không chạy seed mock lên production.**
- Nếu một bước kiểm chứng thất bại, dừng lại và báo cáo thay vì đi tiếp — đặc biệt Task 10 Step 8 mục 6-8 (RLS ghi dữ liệu), nơi lỗi sẽ hiện ra dưới dạng `new row violates row-level security policy`.
