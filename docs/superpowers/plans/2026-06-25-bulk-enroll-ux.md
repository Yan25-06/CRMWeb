# Bulk Enrollment UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép ghi danh nhiều học sinh vào lớp cùng lúc — qua modal multi-select trong tab Học Viên (ClassDetailPage) và qua chế độ chọn hàng loạt ở trang Danh Bạ (StudentsDirectoryPage).

**Architecture:** Thêm 2 modal mới (`BulkEnrollPickerModal`, `BulkFeeModal`) dùng chung 1 component fee presentational (`BulkFeeFields`) và 1 helper ghi danh hàng loạt (`enrollMany`). Không thay đổi DB hay service layer — chỉ gọi `enrollmentService.upsert()` lặp qua `Promise.all`.

**Tech Stack:** React 18, Tailwind (navy tokens), `@/components/ui` (Modal, Button, CurrencyInput, toast), lucide-react.

**⚠️ Lưu ý kiểm thử:** Project **không có test runner / linter** (xem CLAUDE.md). Verification ở mỗi task = `npm run build` build sạch + kiểm thử thủ công qua `npm run dev`. Không viết file test tự động.

**⚠️ Quy ước bắt buộc (CLAUDE.md):**
- Đọc/ghi data **chỉ qua service layer**, không gọi `supabase.*` trong component.
- Không hard-code màu hex — dùng navy tokens.
- `clsx()` cho conditional classes.
- Tiền tệ qua `CurrencyInput` (value = số nguyên VND đầy đủ).
- Service method ghi danh là `enrollmentService.upsert(data)` — conflict trên `(student_id, class_id)`. **KHÔNG có `create`.**

---

## File Structure

| File | Trách nhiệm |
|------|-------------|
| `src/utils/enrollMany.js` | **Tạo mới** — helper async ghi danh 1 batch học sinh vào 1 lớp; trả `{ ok, failed }` |
| `src/components/students/BulkFeeFields.jsx` | **Tạo mới** — presentational: toggle Theo tháng/khóa + CurrencyInput (dùng chung) |
| `src/components/students/BulkFeeModal.jsx` | **Tạo mới** — modal đặt học phí + xác nhận cho StudentsDirectoryPage |
| `src/components/students/BulkEnrollPickerModal.jsx` | **Tạo mới** — modal checklist chọn nhiều HS + fee form cho ClassDetailPage |
| `src/components/students/StudentSidebar.jsx` | **Sửa** — thêm prop `onCreateStudent`; admin thấy 2 nút |
| `src/pages/ClassDetailPage/tabs/StudentsTab.jsx` | **Sửa** — wire picker modal + giữ EnrollmentModal cho tạo mới |
| `src/pages/StudentsDirectoryPage.jsx` | **Sửa** — chế độ ghi danh khi chọn lớp + wire BulkFeeModal |

---

## Task 1: Helper `enrollMany`

Helper thuần (không UI) ghi danh 1 danh sách học sinh vào 1 lớp, gom lỗi từng người.

**Files:**
- Create: `src/utils/enrollMany.js`

- [ ] **Step 1: Viết helper**

```javascript
import { enrollmentService } from '@/services/enrollmentService'

// Ghi danh nhiều học sinh vào 1 lớp với cùng cấu hình học phí.
// fee = { feeType: 'monthly'|'course', monthlyFee: number|'', courseFee: number|'' }
// Trả về { ok: number, failed: Array<{ studentId, message }> }.
export async function enrollMany(studentIds, classId, fee) {
  const { feeType = 'monthly', monthlyFee = '', courseFee = '' } = fee || {}
  const results = await Promise.allSettled(
    studentIds.map(studentId =>
      enrollmentService.upsert({
        studentId,
        classId,
        status: 'active',
        feeType,
        monthlyFee: feeType === 'monthly' ? (Number(monthlyFee) || 0) : null,
        courseFee: feeType === 'course' ? (Number(courseFee) || 0) : null,
        goal: '',
        note: '',
        enrolledAt: new Date().toISOString(),
      })
    )
  )
  const failed = []
  let ok = 0
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') ok++
    else failed.push({ studentId: studentIds[i], message: r.reason?.message || 'Lỗi không xác định' })
  })
  return { ok, failed }
}
```

- [ ] **Step 2: Build kiểm tra cú pháp**

Run: `npm run build`
Expected: Build thành công, không lỗi import/cú pháp.

- [ ] **Step 3: Commit**

```bash
git add src/utils/enrollMany.js
git commit -m "feat(enroll): helper enrollMany ghi danh hàng loạt vào lớp"
```

---

## Task 2: Component `BulkFeeFields`

Presentational fee form (toggle + currency input). Dùng chung bởi `BulkFeeModal` và `BulkEnrollPickerModal`. State do parent giữ.

**Files:**
- Create: `src/components/students/BulkFeeFields.jsx`

- [ ] **Step 1: Viết component**

```jsx
import { clsx } from 'clsx'
import { CurrencyInput } from '@/components/ui'

// Fee form dùng chung cho luồng ghi danh hàng loạt.
// Parent giữ state: feeType + monthlyFee + courseFee.
export const BulkFeeFields = ({
  feeType,
  setFeeType,
  monthlyFee,
  setMonthlyFee,
  courseFee,
  setCourseFee,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-navy-700">Học phí chung cho tất cả</label>
    <div className="flex gap-1 p-1 bg-navy-50 rounded-xl">
      <button
        type="button"
        onClick={() => setFeeType('monthly')}
        className={clsx(
          'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
          feeType === 'monthly' ? 'bg-white shadow-sm text-navy-800' : 'text-navy-500 hover:text-navy-700'
        )}
      >
        Theo tháng
      </button>
      <button
        type="button"
        onClick={() => setFeeType('course')}
        className={clsx(
          'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
          feeType === 'course' ? 'bg-white shadow-sm text-navy-800' : 'text-navy-500 hover:text-navy-700'
        )}
      >
        Theo khóa
      </button>
    </div>
    {feeType === 'monthly' ? (
      <CurrencyInput
        label="Học phí tháng (VNĐ)"
        value={monthlyFee}
        onChange={setMonthlyFee}
        className="text-sm"
      />
    ) : (
      <CurrencyInput
        label="Học phí cả khóa (VNĐ)"
        value={courseFee}
        onChange={setCourseFee}
        className="text-sm"
      />
    )}
  </div>
)
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 3: Commit**

```bash
git add src/components/students/BulkFeeFields.jsx
git commit -m "feat(students): BulkFeeFields presentational fee form dùng chung"
```

---

## Task 3: Component `BulkFeeModal`

Modal đặt học phí + xác nhận cho StudentsDirectoryPage. Nhận danh sách học sinh đã chọn, gọi `enrollMany`.

**Files:**
- Create: `src/components/students/BulkFeeModal.jsx`

- [ ] **Step 1: Viết component**

```jsx
import { useState, useEffect } from 'react'
import { Modal, Button, toast } from '@/components/ui'
import { getInitials } from '@/utils/helpers'
import { enrollMany } from '@/utils/enrollMany'
import { BulkFeeFields } from './BulkFeeFields'

// Bước đặt học phí + xác nhận ghi danh hàng loạt (StudentsDirectoryPage).
// Props:
//   open, onClose
//   classId, className
//   students: Array<{ id, name, phone }>
//   onSaved: () => void   // gọi sau khi ghi danh xong
export const BulkFeeModal = ({ open, onClose, classId, className, students = [], onSaved }) => {
  const [feeType, setFeeType] = useState('monthly')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [courseFee, setCourseFee] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFeeType('monthly')
      setMonthlyFee('')
      setCourseFee('')
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (students.length === 0) return
    setSaving(true)
    try {
      const { ok, failed } = await enrollMany(
        students.map(s => s.id),
        classId,
        { feeType, monthlyFee, courseFee }
      )
      if (ok > 0) toast.success(`Đã ghi danh ${ok} học sinh vào ${className}`)
      if (failed.length > 0) toast.error(`${failed.length} học sinh ghi danh thất bại`)
      onSaved?.()
      onClose?.()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ghi danh ${students.length} học sinh vào ${className}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving || students.length === 0}>
            {saving ? 'Đang ghi danh...' : `Ghi danh ${students.length} học sinh`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {students.map(s => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-navy-50 rounded-lg text-xs text-navy-700"
            >
              <span className="w-5 h-5 rounded-full bg-navy-800 text-white flex items-center justify-center text-[9px] font-bold">
                {getInitials(s.name)}
              </span>
              {s.name}
            </span>
          ))}
        </div>
        <BulkFeeFields
          feeType={feeType}
          setFeeType={setFeeType}
          monthlyFee={monthlyFee}
          setMonthlyFee={setMonthlyFee}
          courseFee={courseFee}
          setCourseFee={setCourseFee}
        />
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 3: Commit**

```bash
git add src/components/students/BulkFeeModal.jsx
git commit -m "feat(students): BulkFeeModal đặt học phí + xác nhận ghi danh hàng loạt"
```

---

## Task 4: Component `BulkEnrollPickerModal`

Modal cho ClassDetailPage: tìm + tick nhiều học sinh (chưa có trong lớp) + fee form + ghi danh.

**Files:**
- Create: `src/components/students/BulkEnrollPickerModal.jsx`

- [ ] **Step 1: Viết component**

```jsx
import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { clsx } from 'clsx'
import { Modal, Button, toast } from '@/components/ui'
import { getInitials } from '@/utils/helpers'
import { studentService } from '@/services/studentService'
import { enrollMany } from '@/utils/enrollMany'
import { BulkFeeFields } from './BulkFeeFields'

// Modal chọn nhiều học sinh để ghi danh vào 1 lớp (ClassDetailPage).
// Props:
//   open, onClose
//   classId
//   currentEnrollments: Enrollment[]   // để loại học sinh đã có trong lớp
//   onSaved: () => void
export const BulkEnrollPickerModal = ({ open, onClose, classId, currentEnrollments = [], onSaved }) => {
  const [allStudents, setAllStudents] = useState([])
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [feeType, setFeeType] = useState('monthly')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [courseFee, setCourseFee] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedIds(new Set())
    setFeeType('monthly')
    setMonthlyFee('')
    setCourseFee('')
    setSaving(false)
    setLoading(true)
    studentService.getAll()
      .then(setAllStudents)
      .catch(err => toast.error('Không tải được học sinh: ' + err.message))
      .finally(() => setLoading(false))
  }, [open])

  const enrolledIds = useMemo(
    () => new Set(currentEnrollments.map(e => e.studentId)),
    [currentEnrollments]
  )

  // Chỉ học sinh chưa có trong lớp + khớp tìm kiếm
  const available = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allStudents
      .filter(s => !enrolledIds.has(s.id))
      .filter(s => !q || s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q)))
  }, [allStudents, enrolledIds, search])

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return
    setSaving(true)
    try {
      const { ok, failed } = await enrollMany(
        [...selectedIds],
        classId,
        { feeType, monthlyFee, courseFee }
      )
      if (ok > 0) toast.success(`Đã thêm ${ok} học viên vào lớp`)
      if (failed.length > 0) toast.error(`${failed.length} học sinh thất bại`)
      onSaved?.()
      onClose?.()
    } catch (err) {
      toast.error('Lỗi: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm học viên vào lớp"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={saving || selectedIds.size === 0}>
            {saving ? 'Đang ghi danh...' : `Ghi danh ${selectedIds.size} học sinh`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8 py-2 text-sm w-full"
          />
        </div>

        {/* Student list */}
        <div className="max-h-60 overflow-y-auto border border-navy-100 rounded-xl divide-y divide-navy-50">
          {loading ? (
            <p className="text-sm text-navy-400 text-center py-8">Đang tải...</p>
          ) : available.length === 0 ? (
            <p className="text-sm text-navy-400 text-center py-8">
              {search ? `Không tìm thấy "${search}"` : 'Không còn học sinh nào để thêm'}
            </p>
          ) : (
            available.map(s => {
              const checked = selectedIds.has(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    checked ? 'bg-navy-50' : 'hover:bg-navy-50/50'
                  )}
                >
                  <span className={clsx(
                    'w-[18px] h-[18px] rounded border-2 flex items-center justify-center shrink-0 text-white text-[11px]',
                    checked ? 'bg-navy-800 border-navy-800' : 'border-navy-300'
                  )}>
                    {checked && '✓'}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {getInitials(s.name)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-navy-900 truncate">{s.name}</span>
                    <span className="block text-xs text-navy-400 truncate">{s.phone || 'Chưa có SĐT'}</span>
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Selected count */}
        {selectedIds.size > 0 && (
          <p className="text-xs font-semibold text-navy-700">Đã chọn {selectedIds.size} học sinh</p>
        )}

        {/* Fee form */}
        <BulkFeeFields
          feeType={feeType}
          setFeeType={setFeeType}
          monthlyFee={monthlyFee}
          setMonthlyFee={setMonthlyFee}
          courseFee={courseFee}
          setCourseFee={setCourseFee}
        />
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 3: Commit**

```bash
git add src/components/students/BulkEnrollPickerModal.jsx
git commit -m "feat(students): BulkEnrollPickerModal chọn nhiều HS ghi danh vào lớp"
```

---

## Task 5: Sửa `StudentSidebar` — 2 nút cho admin

Thêm prop `onCreateStudent`. Admin thấy "＋ Thêm" (mở picker) + "Tạo mới" (mở EnrollmentModal). Giáo viên thường chỉ thấy "＋ Thêm".

**Files:**
- Modify: `src/components/students/StudentSidebar.jsx`

- [ ] **Step 1: Thêm prop `onCreateStudent`**

Sửa signature component (dòng ~20-27), thêm `onCreateStudent` vào destructure:

```jsx
export const StudentSidebar = ({
  enrollments = [],
  students = [],
  activeId,
  onSelect,
  onAddStudent,
  onCreateStudent,
  isAdmin = false,
}) => {
```

- [ ] **Step 2: Thay khối nút trong header**

Tìm khối hiện tại (dòng ~73-82):

```jsx
          {isAdmin && (
            <button
              id="add-student-btn"
              onClick={onAddStudent}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-navy-800 text-white text-xs font-medium rounded-lg hover:bg-navy-700 transition-colors"
            >
              <Plus size={12} />
              Thêm
            </button>
          )}
```

Thay bằng (nút "＋ Thêm" hiện cho mọi user; "Tạo mới" chỉ admin):

```jsx
          <div className="flex items-center gap-1.5">
            <button
              id="add-student-btn"
              onClick={onAddStudent}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-navy-800 text-white text-xs font-medium rounded-lg hover:bg-navy-700 transition-colors"
            >
              <Plus size={12} />
              Thêm
            </button>
            {isAdmin && (
              <button
                id="create-student-btn"
                onClick={onCreateStudent}
                className="px-2.5 py-1.5 border border-navy-200 text-navy-600 text-xs font-medium rounded-lg hover:bg-navy-50 transition-colors"
              >
                Tạo mới
              </button>
            )}
          </div>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 4: Commit**

```bash
git add src/components/students/StudentSidebar.jsx
git commit -m "feat(students): StudentSidebar 2 nút Thêm/Tạo mới cho admin"
```

---

## Task 6: Wire `StudentsTab` — picker + create

Đổi `onAddStudent` để mở `BulkEnrollPickerModal`; thêm `onCreateStudent` mở `EnrollmentModal` (chỉ admin). Truyền `currentEnrollments`.

**Files:**
- Modify: `src/pages/ClassDetailPage/tabs/StudentsTab.jsx`

- [ ] **Step 1: Thêm import**

Sau dòng `import { EnrollmentModal } ...` thêm:

```jsx
import { BulkEnrollPickerModal } from '@/components/students/BulkEnrollPickerModal'
```

- [ ] **Step 2: Thêm state cho 2 modal**

Tìm (dòng ~20-21):

```jsx
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
```

Thay bằng:

```jsx
  const [pickerOpen, setPickerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
```

- [ ] **Step 3: Cập nhật handlers**

Tìm (dòng ~55):

```jsx
  const handleAddStudent = () => setAddModalOpen(true)
  const handleEditEnrollment = () => setEditModalOpen(true)
  const handleModalSaved = () => loadData()
```

Thay bằng:

```jsx
  const handleAddStudent = () => setPickerOpen(true)
  const handleCreateStudent = () => setCreateModalOpen(true)
  const handleEditEnrollment = () => setEditModalOpen(true)
  const handleModalSaved = () => loadData()
```

- [ ] **Step 4: Sửa empty-state**

Tìm khối empty-state (dòng ~64-83). Thay nguyên khối `return (...)` của empty-state bằng:

```jsx
    return (
      <>
        <Card className="p-16 flex flex-col items-center justify-center text-center gap-3">
          <Users size={48} className="text-navy-200" />
          <p className="font-semibold text-navy-700">Lớp chưa có học viên nào</p>
          {isAdmin && <p className="text-sm text-navy-400">Bấm nút bên dưới để thêm học viên</p>}
          {isAdmin && (
            <div className="flex items-center gap-2 mt-2">
              <Button onClick={handleAddStudent}>+ Thêm học viên</Button>
              <Button variant="secondary" onClick={handleCreateStudent}>Tạo học sinh mới</Button>
            </div>
          )}
        </Card>
        <BulkEnrollPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          classId={classId}
          currentEnrollments={enrollments}
          onSaved={handleModalSaved}
        />
        <EnrollmentModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          mode="add"
          classId={classId}
          onSaved={handleModalSaved}
          isAdmin={isAdmin}
        />
      </>
    )
```

- [ ] **Step 5: Truyền prop cho StudentSidebar (cả 2 layout)**

Có 2 chỗ render `<StudentSidebar ... onAddStudent={handleAddStudent} ... />` (desktop ~110 và mobile ~145). Ở **cả hai**, thêm prop `onCreateStudent={handleCreateStudent}` ngay dưới `onAddStudent`:

```jsx
            onAddStudent={handleAddStudent}
            onCreateStudent={handleCreateStudent}
```

- [ ] **Step 6: Thay modal ở cuối return chính**

Tìm khối "Add enrollment" (dòng ~181-189):

```jsx
      {/* ─── Add enrollment ─── */}
      <EnrollmentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        mode="add"
        classId={classId}
        onSaved={handleModalSaved}
        isAdmin={isAdmin}
      />
```

Thay bằng:

```jsx
      {/* ─── Bulk enroll picker ─── */}
      <BulkEnrollPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        classId={classId}
        currentEnrollments={enrollments}
        onSaved={handleModalSaved}
      />

      {/* ─── Create new student (admin) ─── */}
      <EnrollmentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        mode="add"
        classId={classId}
        onSaved={handleModalSaved}
        isAdmin={isAdmin}
      />
```

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 8: Kiểm thử thủ công**

Run: `npm run dev` → mở 1 lớp → tab Học Viên.
- Bấm "＋ Thêm" → modal picker mở, danh sách không chứa HS đã trong lớp.
- Tick 2-3 HS → đặt học phí → "Ghi danh X học sinh" → toast thành công, danh sách lớp cập nhật.
- (Admin) Bấm "Tạo mới" → EnrollmentModal mở như cũ.

- [ ] **Step 9: Commit**

```bash
git add src/pages/ClassDetailPage/tabs/StudentsTab.jsx
git commit -m "feat(class): tab Học Viên dùng BulkEnrollPickerModal + nút Tạo mới"
```

---

## Task 7: Chế độ ghi danh ở `StudentsDirectoryPage`

Khi chọn 1 lớp ở filter → checkbox hiện cho mọi user; thanh "chế độ ghi danh"; nút ghi danh mở `BulkFeeModal`. HS đã trong lớp → checkbox disable.

**Files:**
- Modify: `src/pages/StudentsDirectoryPage.jsx`

- [ ] **Step 1: Thêm import**

Sau `import { EnrollmentModal } ...` thêm:

```jsx
import { BulkFeeModal } from '@/components/students/BulkFeeModal'
```

- [ ] **Step 2: Thêm state cho fee modal**

Cạnh các `useState` modal (dòng ~219-223), thêm:

```jsx
  const [bulkFeeOpen, setBulkFeeOpen] = useState(false)
```

- [ ] **Step 3: Dẫn xuất enrollMode + clear khi đổi lớp**

Ngay sau khai báo `enrollmentsByStudent` useMemo (dòng ~258), thêm:

```jsx
  const enrollMode = classFilter !== ''
  const selectedClassName = classMap[classFilter]?.name || ''

  // HS đã có trong lớp đang lọc (mọi status) → không cho tick lại
  const alreadyInClass = useMemo(() => {
    if (!enrollMode) return new Set()
    return new Set(
      (enrollmentsByStudent
        ? Object.entries(enrollmentsByStudent)
        : []
      )
        .filter(([, enrs]) => enrs.some(e => e.classId === classFilter))
        .map(([sid]) => sid)
    )
  }, [enrollMode, enrollmentsByStudent, classFilter])

  // Đổi lớp → reset lựa chọn
  useEffect(() => { setSelectedIds(new Set()) }, [classFilter])
```

- [ ] **Step 4: Sửa `toggleAll` để bỏ qua HS đã trong lớp**

Tìm `toggleAll` (dòng ~303). Thay bằng (chỉ thao tác trên HS chọn được):

```jsx
  const selectableStudents = useMemo(
    () => filteredStudents.filter(s => !(enrollMode && alreadyInClass.has(s.id))),
    [filteredStudents, enrollMode, alreadyInClass]
  )
  const allSelected = selectableStudents.length > 0 && selectableStudents.every(s => selectedIds.has(s.id))
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        selectableStudents.forEach(s => next.delete(s.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        selectableStudents.forEach(s => next.add(s.id))
        return next
      })
    }
  }
```

> Lưu ý: xóa dòng `const allSelected = filteredStudents.length > 0 && filteredStudents.every(...)` cũ (dòng ~302) — đã thay bằng bản trên dựa trên `selectableStudents`.

- [ ] **Step 5: Thêm handler ghi danh**

Sau `doBulkDelete` (dòng ~341), thêm:

```jsx
  const selectedStudentObjs = useMemo(
    () => students.filter(s => selectedIds.has(s.id)),
    [students, selectedIds]
  )

  const handleBulkEnroll = () => {
    if (selectedIds.size === 0) return
    setBulkFeeOpen(true)
  }

  const handleEnrolled = () => {
    setSelectedIds(new Set())
    loadData()
  }
```

- [ ] **Step 6: Hiện checkbox cột & header trong enrollMode**

Trong `StudentRow` (dòng ~49), điều kiện hiện checkbox đổi từ `isAdmin` sang `showCheckbox` (prop mới). Sửa signature `StudentRow` (dòng ~38) thêm `showCheckbox, disabledCheck`:

```jsx
const StudentRow = ({ student, enrollments, classes, selected, onSelect, onClick, classMap, isAdmin, showCheckbox, disabledCheck }) => {
```

Sửa khối checkbox (dòng ~49-58):

```jsx
      {showCheckbox && (
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            disabled={disabledCheck}
            onChange={onSelect}
            className="rounded border-navy-300 text-navy-800 focus:ring-navy-500 disabled:opacity-40"
          />
        </td>
      )}
```

- [ ] **Step 7: Sửa header checkbox + truyền props cho StudentRow**

Header checkbox (dòng ~550-559): đổi `{isAdmin && (` thành `{(isAdmin || enrollMode) && (`.

Trong `.map(student => <StudentRow ... />)` (dòng ~569-579), sửa thành:

```jsx
                  {filteredStudents.map(student => {
                    const inClass = enrollMode && alreadyInClass.has(student.id)
                    return (
                      <StudentRow
                        key={student.id}
                        student={student}
                        enrollments={enrollmentsByStudent[student.id] || []}
                        classMap={classMap}
                        isAdmin={isAdmin}
                        showCheckbox={isAdmin || enrollMode}
                        disabledCheck={inClass}
                        selected={selectedIds.has(student.id)}
                        onSelect={() => !inClass && toggleOne(student.id)}
                        onClick={() => setSelectedStudent(prev => prev?.id === student.id ? null : student)}
                      />
                    )
                  })}
```

- [ ] **Step 8: Thanh chế độ ghi danh + nút**

Trong "Action row" (dòng ~468-527), ngay sau thẻ mở `<div className="flex gap-2 flex-wrap items-center">`, thêm banner enrollMode ở đầu:

```jsx
          {enrollMode && (
            <div className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-xs text-amber-800 font-medium">
                ⚡ Đang chọn để ghi danh vào <strong>{selectedClassName}</strong>
              </span>
              <div className="ml-auto flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button size="sm" onClick={handleBulkEnroll}>
                    Ghi danh {selectedIds.size} học sinh
                  </Button>
                )}
                <button
                  onClick={() => { setClassFilter(''); setSelectedIds(new Set()) }}
                  className="text-xs text-amber-700 hover:text-amber-900 font-medium"
                >
                  Thoát
                </button>
              </div>
            </div>
          )}
```

- [ ] **Step 9: Ẩn nút Xóa hàng loạt khi enrollMode**

Tìm (dòng ~521):

```jsx
          {isAdmin && selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <Trash2 size={14} className="mr-1" />
              Xóa {selectedIds.size}
            </Button>
          )}
```

Thay điều kiện thành:

```jsx
          {isAdmin && !enrollMode && selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <Trash2 size={14} className="mr-1" />
              Xóa {selectedIds.size}
            </Button>
          )}
```

- [ ] **Step 10: Render `BulkFeeModal`**

Sau `<ConfirmModal ... />` cuối file (dòng ~647-654), thêm trước thẻ đóng:

```jsx
      <BulkFeeModal
        open={bulkFeeOpen}
        onClose={() => setBulkFeeOpen(false)}
        classId={classFilter}
        className={selectedClassName}
        students={selectedStudentObjs}
        onSaved={() => { setBulkFeeOpen(false); handleEnrolled() }}
      />
```

- [ ] **Step 11: Build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 12: Kiểm thử thủ công**

Run: `npm run dev` → trang Danh Bạ Học Viên.
- Chọn 1 lớp ở dropdown → banner vàng + checkbox xuất hiện (cả khi đăng nhập giáo viên thường).
- HS đã trong lớp đó → checkbox mờ/disable.
- Tick vài HS → "Ghi danh X học sinh" → BulkFeeModal → đặt phí → xác nhận → toast, lựa chọn reset.
- Bỏ chọn lớp (về "Tất cả lớp") → checkbox ẩn (trừ khi admin), banner mất.
- (Admin) Khi enrollMode: nút "Xóa" không hiện.

- [ ] **Step 13: Commit**

```bash
git add src/pages/StudentsDirectoryPage.jsx
git commit -m "feat(students): chế độ ghi danh hàng loạt khi chọn lớp ở Danh Bạ"
```

---

## Task 8: Cập nhật CLAUDE.md

Theo quy tắc bắt buộc của repo: cập nhật tài liệu sau khi thay đổi tính năng.

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Cập nhật mô tả StudentsTab + StudentsDirectoryPage**

Tìm dòng mô tả **Students Directory** (mục Routing & Layout). Bổ sung câu mô tả chế độ ghi danh hàng loạt. Tìm:

```
- **Students Directory** (`StudentsDirectoryPage`): route `students`, danh bạ tổng tất cả học sinh, lọc theo trạng thái/lớp/loại khóa, tìm kiếm, thêm nhanh, import Excel, bulk delete, sidebar chi tiết, điều hướng đến lớp. Prop `onNavigateToClass(classId)` từ `App.jsx`.
```

Thay bằng:

```
- **Students Directory** (`StudentsDirectoryPage`): route `students`, danh bạ tổng tất cả học sinh, lọc theo trạng thái/lớp/loại khóa, tìm kiếm, thêm nhanh, import Excel, bulk delete, sidebar chi tiết, điều hướng đến lớp. Prop `onNavigateToClass(classId)` từ `App.jsx`. **Ghi danh hàng loạt:** khi chọn 1 lớp ở filter → "chế độ ghi danh" (checkbox hiện cho mọi user, HS đã trong lớp bị disable) → tick → `BulkFeeModal` đặt học phí chung → ghi danh qua `enrollMany`. Nút "Xóa hàng loạt" ẩn trong chế độ này.
```

- [ ] **Step 2: Thêm mô tả bulk enroll ở tab Học Viên**

Tìm mô tả `ClassDetailPage` có các tab (mục Routing & Layout). Sau câu mô tả tab Students, thêm 1 câu. Tìm:

```
- `ClassDetailPage` có các tab: Students, Attendance, Homework, MockTest.
```

Thay bằng:

```
- `ClassDetailPage` có các tab: Students, Attendance, Homework, MockTest. Tab Students: nút "＋ Thêm" mở `BulkEnrollPickerModal` (chọn nhiều HS chưa có trong lớp + học phí chung → ghi danh hàng loạt qua `enrollMany`); admin có thêm nút "Tạo mới" mở `EnrollmentModal` để tạo học sinh mới.
```

- [ ] **Step 3: Ghi chú component/helper mới ở mục cấu trúc**

Trong mục "Model học sinh" (gần `ImportStudentsModal`), thêm dòng:

```
- **Ghi danh hàng loạt:** `src/utils/enrollMany.js` (helper Promise.allSettled gọi `enrollmentService.upsert`), `BulkFeeFields.jsx` (fee form presentational dùng chung), `BulkFeeModal.jsx` (StudentsDirectoryPage), `BulkEnrollPickerModal.jsx` (ClassDetailPage tab Students).
```

- [ ] **Step 4: Build (đảm bảo không vô tình hỏng gì) + commit**

Run: `npm run build`
Expected: Build thành công.

```bash
git add CLAUDE.md
git commit -m "docs(claude): mô tả tính năng ghi danh hàng loạt"
```

---

## Self-Review Notes

- **Spec coverage:** ClassDetailPage bulk (Task 4,6) ✓; StudentsDirectoryPage bulk (Task 3,7) ✓; fee chung 1 mức (Approach A) ✓; HS đã trong lớp bị loại/disable ✓; admin dual-button ✓; `upsert` thay vì `create` (sửa so với spec ban đầu) ✓.
- **Type consistency:** `enrollMany(studentIds, classId, fee)` ký hiệu nhất quán giữa Task 1/3/4. `BulkFeeFields` props khớp giữa Task 2/3/4. `BulkFeeModal` props (`classId, className, students, onSaved`) khớp Task 3/7. `BulkEnrollPickerModal` props (`classId, currentEnrollments, onSaved`) khớp Task 4/6.
- **No test runner:** verification = build + manual (đã ghi rõ ở header).
