# Tài Liệu Giảng Dạy (Class Materials) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép admin gửi tài liệu giảng dạy (slide, handout, bài tập nghe/nói) dạng đường link gắn theo lớp; giáo viên xem trong tab "Tài Liệu" mới ở trang Giảng Dạy.

**Architecture:** Thêm bảng Supabase `class_materials` (RLS: admin full CRUD, giáo viên SELECT lớp mình) → service layer `classMaterialService` theo pattern `fromDB/toDB` → tab thứ 3 trong `SchedulePage` render `MaterialsTab` (dropdown chọn lớp + list link, nút thêm/sửa/xóa chỉ admin) + `MaterialModal` để thêm/sửa.

**Tech Stack:** React 18 + Vite, Tailwind (navy tokens), Supabase JS, lucide-react, components từ `@/components/ui`, phân quyền qua `usePermissions()`.

**Lưu ý quan trọng:** Project **không có test runner** (xem CLAUDE.md). Thay cho TDD tự động, mỗi task verify bằng `npm run build` (lint cú pháp/import) và kiểm thử thủ công trên `npm run dev`. Bước "Run migration" thực hiện thủ công trong Supabase SQL Editor (không có Supabase CLI local trong repo).

---

## File Structure

| File | Trách nhiệm |
|------|-------------|
| `supabase/migrations/20260627000002_add_class_materials.sql` | Tạo bảng + RLS (mới) |
| `src/services/classMaterialService.js` | Đọc/ghi `class_materials` qua Supabase (mới) |
| `src/components/schedule/materialType.js` | Hằng số loại tài liệu + label + badge style (mới, tránh lặp giữa Tab & Modal) |
| `src/components/schedule/MaterialModal.jsx` | Form thêm/sửa tài liệu (mới) |
| `src/components/schedule/MaterialsTab.jsx` | Tab nội dung: dropdown lớp + list + nút admin (mới) |
| `src/pages/SchedulePage.jsx` | Thêm tab thứ 3 "Tài Liệu" (sửa) |
| `supabase/seed/seed_mock_data.sql` | Thêm dữ liệu mẫu (sửa) |
| `CLAUDE.md` | Cập nhật mô tả tính năng (sửa) |

---

## Task 1: Migration — bảng `class_materials` + RLS

**Files:**
- Create: `supabase/migrations/20260627000002_add_class_materials.sql`

- [ ] **Step 1: Viết file migration**

```sql
-- Tài liệu giảng dạy gắn theo lớp. Admin tạo/sửa/xóa, giáo viên chỉ đọc lớp mình.
create table if not exists public.class_materials (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  url text not null,
  type text not null check (type in ('slide', 'handout', 'listening', 'speaking', 'other')),
  created_by uuid references public.teachers(id),
  created_at timestamptz default now()
);

create index if not exists class_materials_class_id_idx on public.class_materials(class_id);

alter table public.class_materials enable row level security;

-- Admin: toàn quyền đọc/ghi
create policy "class_materials: admin all"
  on public.class_materials for all
  using (is_admin())
  with check (is_admin());

-- Giáo viên: chỉ SELECT tài liệu của lớp mình phụ trách
create policy "class_materials: teacher select"
  on public.class_materials for select
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_materials.class_id
        and c.teacher_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Chạy migration trong Supabase SQL Editor**

Mở Supabase Dashboard → SQL Editor → dán toàn bộ nội dung file → Run.
Expected: "Success. No rows returned." Bảng `class_materials` xuất hiện trong Table Editor với RLS enabled.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260627000002_add_class_materials.sql
git commit -m "feat(db): bảng class_materials + RLS cho tài liệu giảng dạy"
```

---

## Task 2: Service layer — `classMaterialService`

**Files:**
- Create: `src/services/classMaterialService.js`

- [ ] **Step 1: Viết service**

Theo pattern chuẩn (xem `classService.js`): `fromDB/toDB`, `throw new Error(error.message)`, `create` gắn `created_by` qua `getUid()`.

```javascript
import { supabase } from '@/lib/supabase'
import { getUid } from './studentService'

const fromDB = (row) => row ? {
  id: row.id,
  classId: row.class_id,
  title: row.title,
  url: row.url,
  type: row.type,
  createdBy: row.created_by,
  createdAt: row.created_at,
} : null

const toDB = (data) => {
  const row = {}
  if (data.classId !== undefined) row.class_id = data.classId
  if (data.title !== undefined) row.title = data.title
  if (data.url !== undefined) row.url = data.url
  if (data.type !== undefined) row.type = data.type
  return row
}

export const classMaterialService = {
  async getByClass(classId) {
    const { data, error } = await supabase
      .from('class_materials')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(fromDB)
  },

  async create(data) {
    const created_by = await getUid()
    const { data: row, error } = await supabase
      .from('class_materials')
      .insert({ ...toDB(data), created_by })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from('class_materials')
      .update(toDB(data))
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return fromDB(row)
  },

  async remove(id) {
    const { error } = await supabase
      .from('class_materials')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
```

- [ ] **Step 2: Verify build (kiểm tra cú pháp/import)**

Run: `npm run build`
Expected: Build thành công, không lỗi import `classMaterialService`.

- [ ] **Step 3: Commit**

```bash
git add src/services/classMaterialService.js
git commit -m "feat(service): classMaterialService cho tài liệu giảng dạy"
```

---

## Task 3: Hằng số loại tài liệu — `materialType.js`

**Files:**
- Create: `src/components/schedule/materialType.js`

- [ ] **Step 1: Viết file hằng số**

Tập trung label + badge style để Tab và Modal dùng chung (DRY). Badge style theo design spec.

```javascript
// Loại tài liệu giảng dạy — dùng chung bởi MaterialsTab và MaterialModal.
export const MATERIAL_TYPES = [
  { value: 'slide',     label: 'Slide',         badge: 'bg-blue-100 text-blue-700' },
  { value: 'handout',   label: 'Handout',       badge: 'bg-green-100 text-green-700' },
  { value: 'listening', label: 'Bài tập nghe',  badge: 'bg-purple-100 text-purple-700' },
  { value: 'speaking',  label: 'Bài tập nói',   badge: 'bg-orange-100 text-orange-700' },
  { value: 'other',     label: 'Khác',          badge: 'bg-navy-50 text-navy-700' },
]

const TYPE_MAP = Object.fromEntries(MATERIAL_TYPES.map(t => [t.value, t]))

export const getMaterialType = (value) => TYPE_MAP[value] ?? TYPE_MAP.other
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule/materialType.js
git commit -m "feat(schedule): hằng số loại tài liệu giảng dạy"
```

---

## Task 4: `MaterialModal` — form thêm/sửa

**Files:**
- Create: `src/components/schedule/MaterialModal.jsx`

- [ ] **Step 1: Viết modal**

Pattern theo `ScheduleModal.jsx` (Modal + Input + Select từ `@/components/ui`, footer có nút Xóa khi edit, validate inline). Validate link bắt đầu `http://`/`https://`.

```jsx
import { useState, useEffect } from 'react'
import { Modal, Button, Input, Select } from '@/components/ui'
import { Trash2 } from 'lucide-react'
import { MATERIAL_TYPES } from './materialType'

const EMPTY_FORM = { title: '', url: '', type: 'slide' }

/**
 * MaterialModal — thêm/sửa tài liệu giảng dạy
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Object}   editingItem - null = thêm, object = sửa
 * @param {Function} onSave      - callback({ data, isEdit, id })
 * @param {Function} onDelete    - callback(id)
 */
export const MaterialModal = ({ open, onClose, editingItem, onSave, onDelete }) => {
  const isEdit = !!editingItem
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (open) {
      if (editingItem) {
        setForm({
          title: editingItem.title ?? '',
          url:   editingItem.url ?? '',
          type:  editingItem.type ?? 'slide',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErrors({})
      setConfirmDelete(false)
    }
  }, [open, editingItem])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Vui lòng nhập tên tài liệu'
    if (!form.url.trim()) e.url = 'Vui lòng nhập đường link'
    else if (!/^https?:\/\//i.test(form.url.trim()))
      e.url = 'Link phải bắt đầu bằng http:// hoặc https://'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    const data = {
      title: form.title.trim(),
      url:   form.url.trim(),
      type:  form.type,
    }
    onSave?.({ data, isEdit, id: editingItem?.id })
    onClose?.()
  }

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete?.(editingItem.id)
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa Tài Liệu' : 'Thêm Tài Liệu'}
      footer={
        <div className="flex items-center justify-between gap-2">
          {isEdit && (
            <Button variant="danger" size="sm" onClick={handleDelete} className="flex items-center gap-1.5">
              <Trash2 size={14} />
              {confirmDelete ? 'Xác nhận xóa?' : 'Xóa'}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              {isEdit ? 'Cập nhật' : 'Thêm tài liệu'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Tên tài liệu"
          placeholder="VD: Slide Unit 5 - Present Perfect"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          error={errors.title}
        />

        <Select
          label="Loại tài liệu"
          value={form.type}
          onChange={e => set('type', e.target.value)}
        >
          {MATERIAL_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>

        <Input
          label="Đường link"
          placeholder="https://drive.google.com/..."
          value={form.url}
          onChange={e => set('url', e.target.value)}
          error={errors.url}
        />
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule/MaterialModal.jsx
git commit -m "feat(schedule): MaterialModal thêm/sửa tài liệu"
```

---

## Task 5: `MaterialsTab` — dropdown lớp + list

**Files:**
- Create: `src/components/schedule/MaterialsTab.jsx`

- [ ] **Step 1: Viết tab**

Nhận props `classes` (danh sách lớp đã load ở SchedulePage) và `isAdmin`. Tự fetch tài liệu khi đổi lớp. Mặc định chọn lớp đầu tiên. Nút thêm/sửa/xóa chỉ admin. Click tên tài liệu mở link tab mới.

```jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, ExternalLink, Pencil, Trash2, FileText } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Empty, Skeleton, toast } from '@/components/ui'
import { classMaterialService } from '@/services/classMaterialService'
import { getMaterialType } from './materialType'
import { MaterialModal } from './MaterialModal'

/**
 * MaterialsTab — tài liệu giảng dạy theo lớp
 * @param {Array}   classes - lớp đã load ở SchedulePage (giáo viên: lớp mình; admin: tất cả)
 * @param {boolean} isAdmin
 */
export const MaterialsTab = ({ classes = [], isAdmin = false }) => {
  const [selectedClassId, setSelectedClassId] = useState('')
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Mặc định chọn lớp đầu tiên khi danh sách lớp sẵn sàng
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  const loadMaterials = useCallback(async () => {
    if (!selectedClassId) { setMaterials([]); return }
    setLoading(true)
    try {
      const rows = await classMaterialService.getByClass(selectedClassId)
      setMaterials(rows)
    } catch {
      toast.error('Không thể tải tài liệu')
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [selectedClassId])

  useEffect(() => { loadMaterials() }, [loadMaterials])

  const openAdd = () => { setEditingItem(null); setModalOpen(true) }
  const openEdit = (item) => { setEditingItem(item); setModalOpen(true) }

  const handleSave = useCallback(async ({ data, isEdit, id }) => {
    try {
      if (isEdit) {
        await classMaterialService.update(id, data)
        toast.success('Đã cập nhật tài liệu')
      } else {
        await classMaterialService.create({ ...data, classId: selectedClassId })
        toast.success('Đã thêm tài liệu')
      }
      await loadMaterials()
    } catch {
      toast.error('Không thể lưu tài liệu')
    }
  }, [selectedClassId, loadMaterials])

  const handleDelete = useCallback(async (id) => {
    try {
      await classMaterialService.remove(id)
      toast.success('Đã xóa tài liệu')
      await loadMaterials()
    } catch {
      toast.error('Không thể xóa tài liệu')
    }
  }, [loadMaterials])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: chọn lớp + nút thêm */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-navy-100 shadow-navy-sm px-3 py-2 flex-wrap">
        <span className="text-xs text-navy-400 shrink-0">Lớp:</span>
        <select
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
          className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 text-navy-700 bg-navy-50 hover:bg-navy-100 focus:outline-none focus:ring-2 focus:ring-navy-300 transition-colors cursor-pointer"
        >
          {classes.length === 0 && <option value="">— Chưa có lớp —</option>}
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex-1" />
        {isAdmin && selectedClassId && (
          <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-1.5 shrink-0">
            <Plus size={14} />
            Thêm
          </Button>
        )}
      </div>

      {/* Danh sách tài liệu */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-navy-sm">
        {loading ? (
          <div className="p-4 flex flex-col gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : materials.length === 0 ? (
          <div className="p-12">
            <Empty
              icon={<FileText size={40} />}
              title="Chưa có tài liệu"
              desc={isAdmin ? 'Bấm "Thêm" để gửi tài liệu đầu tiên cho lớp này.' : 'Lớp này chưa có tài liệu giảng dạy.'}
            />
          </div>
        ) : (
          <ul className="divide-y divide-navy-50">
            {materials.map(m => {
              const t = getMaterialType(m.type)
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-md shrink-0', t.badge)}>
                    {t.label}
                  </span>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-navy-800 hover:text-navy-600 hover:underline min-w-0 flex-1"
                  >
                    <span className="truncate">{m.title}</span>
                    <ExternalLink size={13} className="shrink-0 text-navy-400" />
                  </a>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                        title="Sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <MaterialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
```

> **Lưu ý:** Nút Xóa inline ở list xóa ngay không confirm để gọn; `MaterialModal` (khi edit) vẫn có nút Xóa 2 bước. Đây là chủ ý — nếu muốn confirm cả ở list, dùng `ConfirmModal` từ `@/components/ui`. Giữ như trên cho MVP.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build thành công.

- [ ] **Step 3: Commit**

```bash
git add src/components/schedule/MaterialsTab.jsx
git commit -m "feat(schedule): MaterialsTab danh sách tài liệu theo lớp"
```

---

## Task 6: Tích hợp tab thứ 3 vào `SchedulePage`

**Files:**
- Modify: `src/pages/SchedulePage.jsx`

- [ ] **Step 1: Import `MaterialsTab`**

Thêm vào nhóm import component schedule (sau dòng import `SubstituteAssignments`, khoảng dòng 15):

```jsx
import { MaterialsTab } from '@/components/schedule/MaterialsTab'
```

- [ ] **Step 2: Thêm nút tab "Tài Liệu"**

Trong khối Tabs (`<div className="flex items-center gap-1 border-b border-navy-100">`), sau nút "Bảng Lương" (sau dòng `</button>` đóng nút payroll, khoảng dòng 334), thêm:

```jsx
        <button
          onClick={() => setActiveTab('materials')}
          className={clsx(
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'materials'
              ? 'border-navy-800 text-navy-900'
              : 'border-transparent text-navy-400 hover:text-navy-700'
          )}
        >
          Tài Liệu
        </button>
```

- [ ] **Step 3: Render `MaterialsTab` khi tab active**

Sau khối `{activeTab === 'payroll' && (...)}` (sau dòng `)}` đóng khối payroll, khoảng dòng 502), thêm:

```jsx
      {activeTab === 'materials' && (
        <MaterialsTab
          classes={visibleClasses}
          isAdmin={isAdmin}
        />
      )}
```

> Dùng `visibleClasses` (đã lọc theo teacher filter của admin) và `isAdmin` (= `canFilterByTeacher`, đã có sẵn ở dòng 47). Giáo viên thường: `classService.getAll()` qua RLS chỉ trả lớp của họ.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build thành công, không lỗi.

- [ ] **Step 5: Kiểm thử thủ công**

Run: `npm run dev` → mở http://localhost:5173 → đăng nhập.
- Admin: vào "Giảng Dạy" → tab "Tài Liệu" → chọn lớp → "Thêm" → nhập tên + link `https://...` + loại → Lưu → tài liệu hiện trong list với badge đúng màu. Click tên → mở tab mới. Sửa/Xóa hoạt động.
- Thử link không hợp lệ (vd `abc.com`) → hiện lỗi "Link phải bắt đầu bằng http://...".
- Giáo viên thường (tài khoản không admin): tab "Tài Liệu" chỉ thấy list, KHÔNG có nút Thêm/Sửa/Xóa.

Expected: Tất cả hành vi trên đúng như mô tả.

- [ ] **Step 6: Commit**

```bash
git add src/pages/SchedulePage.jsx
git commit -m "feat(schedule): thêm tab Tài Liệu vào trang Giảng Dạy"
```

---

## Task 7: Seed mock data

**Files:**
- Modify: `supabase/seed/seed_mock_data.sql`

- [ ] **Step 1: Tìm vị trí chèn**

Đọc cuối file `supabase/seed/seed_mock_data.sql` để xác định: (a) biến/CTE chứa class id của các lớp mock, (b) phần cleanup ở đầu file (để thêm DELETE scope theo teacher mock cho idempotent). Tìm cách các bảng khác (vd `homeworks`, `reviews`) được seed để theo đúng style biến lớp.

- [ ] **Step 2: Thêm cleanup (idempotent)**

Trong phần cleanup đầu file (nơi DELETE các bảng nghiệp vụ theo teacher mock), thêm dòng DELETE `class_materials` theo cùng scope. Mẫu (điều chỉnh tên biến/subquery cho khớp file thực tế):

```sql
delete from public.class_materials
where class_id in (
  select id from public.classes where teacher_id = any(mock_teacher_ids)
);
```

- [ ] **Step 3: Thêm INSERT dữ liệu mẫu**

Sau phần seed lớp/buổi học, thêm vài tài liệu mẫu cho 1–2 lớp mock đủ các loại. Mẫu (điều chỉnh cách lấy class id cho khớp style file):

```sql
insert into public.class_materials (class_id, title, url, type, created_by)
select c.id, v.title, v.url, v.type, c.teacher_id
from (values
  ('Slide Unit 5 - Present Perfect', 'https://drive.google.com/file/d/mock-slide-u5', 'slide'),
  ('Handout Grammar Unit 5',         'https://docs.google.com/document/d/mock-handout-u5', 'handout'),
  ('Listening Practice IELTS 6.5',   'https://www.youtube.com/watch?v=mock-listening', 'listening'),
  ('Speaking Part 2 Cue Cards',      'https://drive.google.com/file/d/mock-speaking', 'speaking')
) as v(title, url, type)
cross join (
  select id, teacher_id from public.classes
  where teacher_id = any(mock_teacher_ids)
  order by created_at limit 1
) c;
```

> Nếu file seed không dùng biến `mock_teacher_ids` mà dùng cơ chế khác (vd email lookup), thay subquery cho khớp pattern hiện có trong file. Mục tiêu: gắn tài liệu vào 1 lớp mock bất kỳ của teacher mock.

- [ ] **Step 4: Chạy lại seed trong Supabase SQL Editor để verify**

Điền 3 placeholder email → dán toàn bộ file → Run 2 lần liên tiếp.
Expected: Cả 2 lần đều "Success", không lỗi duplicate (idempotent). Table Editor `class_materials` có 4 dòng mock.

- [ ] **Step 5: Commit**

```bash
git add supabase/seed/seed_mock_data.sql
git commit -m "feat(seed): thêm tài liệu giảng dạy mẫu"
```

---

## Task 8: Cập nhật tài liệu dự án

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Cập nhật CLAUDE.md**

Thêm/cập nhật các mục sau cho khớp code (theo quy tắc bắt buộc đầu file CLAUDE.md):

1. Trong danh sách services (mục "Services đã có"): thêm `classMaterialService`.
2. Trong mô tả SchedulePage (mục "Trang 'Giảng Dạy' (SchedulePage) — 2 tab"): đổi thành **3 tab**, thêm mô tả tab "Tài Liệu":

```markdown
  - **Tab "Tài Liệu"** (`MaterialsTab.jsx`): admin gửi tài liệu giảng dạy (slide, handout, bài tập nghe/nói) dạng đường link gắn theo lớp; giáo viên xem list. Dropdown chọn lớp (giáo viên: lớp mình qua RLS; admin: tất cả). Nút Thêm/Sửa/Xóa chỉ admin (`isAdmin`). Loại tài liệu + badge style ở `src/components/schedule/materialType.js`. Modal thêm/sửa `MaterialModal.jsx` (validate link http/https).
```

3. Thêm mục model mới ở cuối (cạnh các "Model ..."):

```markdown
## Model tài liệu giảng dạy (migration 20260627000002)
- **Bảng `class_materials`**: `class_id` (FK classes), `title`, `url`, `type` (CHECK: slide/handout/listening/speaking/other), `created_by` (FK teachers), `created_at`.
- RLS: admin full CRUD (`is_admin()`); giáo viên SELECT lớp mình phụ trách (`classes.teacher_id = auth.uid()`).
- Service `classMaterialService` (`getByClass/create/update/remove`), `create` gắn `created_by` qua `getUid()`.
- UI: tab "Tài Liệu" trong SchedulePage → `MaterialsTab.jsx` + `MaterialModal.jsx`; hằng số loại ở `materialType.js`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: cập nhật CLAUDE.md cho tính năng tài liệu giảng dạy"
```

---

## Self-Review (đã thực hiện khi viết plan)

**Spec coverage:**
- Bảng `class_materials` + cột → Task 1 ✅
- RLS admin/teacher → Task 1 ✅
- Service `getByClass/create/update/remove` → Task 2 ✅
- Tab thứ 3 trong SchedulePage → Task 6 ✅
- MaterialsTab (dropdown lớp + list + badge + Empty + loading) → Task 5 ✅
- MaterialModal (3 field + validate link) → Task 4 ✅
- Badge màu theo loại → Task 3 (`materialType.js`) ✅
- Phân quyền `isAdmin` → Task 5 + Task 6 ✅
- Migration file → Task 1 ✅
- Seed mock → Task 7 ✅
- Cập nhật CLAUDE.md → Task 8 ✅

**Placeholder scan:** Không có TBD/TODO trong code steps. Task 7 có hướng dẫn điều chỉnh theo file seed thực tế (cần đọc file trước) — đây là chủ ý vì cấu trúc seed chưa nằm trong context; engineer phải đọc file ở Step 1.

**Type consistency:** `classMaterialService` method names (`getByClass/create/update/remove`) khớp giữa Task 2, 5. Props `classes`/`isAdmin` khớp giữa Task 5 (MaterialsTab) và Task 6 (SchedulePage). `editingItem/onSave/onDelete` khớp giữa Task 4 (MaterialModal) và Task 5. `MATERIAL_TYPES/getMaterialType` khớp giữa Task 3, 4, 5. Callback `onSave({ data, isEdit, id })` shape khớp giữa Modal và Tab handler.
