# Design: Tài Liệu Giảng Dạy (Class Materials)

**Ngày:** 2026-06-27  
**Trạng thái:** Approved

## Tổng quan

Admin trung tâm gửi tài liệu giảng dạy (slide, handout, bài tập nghe/nói) dưới dạng đường link cho giáo viên. Tài liệu gắn theo lớp học. Giáo viên xem trong tab "Tài Liệu" mới ở trang Giảng Dạy (SchedulePage).

## Data Model

### Bảng mới: `class_materials`

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK DEFAULT gen_random_uuid() | |
| `class_id` | uuid NOT NULL FK → classes(id) ON DELETE CASCADE | |
| `title` | text NOT NULL | Tên tài liệu |
| `url` | text NOT NULL | Đường link (phải bắt đầu http/https) |
| `type` | text NOT NULL CHECK | `'slide'` \| `'handout'` \| `'listening'` \| `'speaking'` \| `'other'` |
| `created_by` | uuid FK → teachers(id) | Admin tạo |
| `created_at` | timestamptz DEFAULT now() | |

### RLS

- **Admin**: full INSERT / UPDATE / DELETE / SELECT (điều kiện `is_admin()`)
- **Giáo viên thường**: SELECT chỉ với lớp mình phụ trách — join `classes` kiểm tra `teacher_id = auth.uid()`

## Service Layer

**File:** `src/services/classMaterialService.js`

Pattern chuẩn `fromDB/toDB` (snake_case ↔ camelCase). Methods:

| Method | Mô tả |
|--------|-------|
| `getByClass(classId)` | Lấy tất cả tài liệu của một lớp |
| `create(data)` | Admin thêm tài liệu (`classId`, `title`, `url`, `type`) |
| `update(id, data)` | Admin sửa tài liệu |
| `remove(id)` | Admin xóa tài liệu |

`create` gắn `created_by` qua `getUid()`.

## UI

### SchedulePage — Tab thứ 3: "Tài Liệu"

SchedulePage hiện có 2 tab: "Lịch Dạy" và "Bảng Lương". Thêm tab thứ 3 "Tài Liệu" render `MaterialsTab`.

### MaterialsTab (`src/components/schedule/MaterialsTab.jsx`)

Layout:
```
┌─────────────────────────────────────────────┐
│  Lớp: [Dropdown chọn lớp ▼]   [+ Thêm] ← admin only
├─────────────────────────────────────────────┤
│  [Slide]   Slide Unit 5 - Present Perfect    │
│            drive.google.com/...  [Sửa][Xóa] │
│                                              │
│  [Nghe]    Listening Practice - IELTS 6.5   │
│            youtube.com/...       [Sửa][Xóa] │
└─────────────────────────────────────────────┘
```

- Dropdown lấy danh sách lớp của giáo viên hiện tại; admin thấy tất cả lớp
- Mỗi dòng: badge loại + tên tài liệu (click → mở link tab mới) + nút Sửa/Xóa (admin only)
- Khi chưa có tài liệu: component `<Empty />`
- Loading state khi fetch

### Badge màu theo loại

| Loại | Style |
|------|-------|
| slide | `bg-blue-100 text-blue-700` |
| handout | `bg-green-100 text-green-700` |
| listening | `bg-purple-100 text-purple-700` |
| speaking | `bg-orange-100 text-orange-700` |
| other | `bg-navy-50 text-navy-700` |

### MaterialModal (`src/components/schedule/MaterialModal.jsx`)

Modal thêm/sửa tài liệu. Fields:
- **Tên tài liệu** (text, required)
- **Loại** (Select: Slide / Handout / Bài tập nghe / Bài tập nói / Khác)
- **Đường link** (text, required, validate: bắt đầu `http://` hoặc `https://`)

Submit: `classMaterialService.create` hoặc `.update`. Toast success/error.

## Phân quyền

Dùng `usePermissions()` — không cần thêm cờ mới, dùng `isAdmin` đã có:
- `isAdmin = true`: hiện nút "+ Thêm", "Sửa", "Xóa"
- `isAdmin = false`: chỉ xem danh sách và click mở link

## Migration

**File:** `supabase/migrations/20260627000002_add_class_materials.sql`

```sql
CREATE TABLE class_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('slide', 'handout', 'listening', 'speaking', 'other')),
  created_by uuid REFERENCES teachers(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;

-- Admin full write
CREATE POLICY "class_materials: admin all" ON class_materials
  FOR ALL USING (EXISTS (
    SELECT 1 FROM teachers WHERE id = auth.uid() AND is_admin = true
  ));

-- Teacher select own classes
CREATE POLICY "class_materials: teacher select" ON class_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_materials.class_id
        AND classes.teacher_id = auth.uid()
    )
  );
```

## Files cần tạo / sửa

| File | Hành động |
|------|-----------|
| `supabase/migrations/20260627000002_add_class_materials.sql` | Tạo mới |
| `src/services/classMaterialService.js` | Tạo mới |
| `src/components/schedule/MaterialsTab.jsx` | Tạo mới |
| `src/components/schedule/MaterialModal.jsx` | Tạo mới |
| `src/pages/SchedulePage.jsx` | Sửa — thêm tab thứ 3 |
| `supabase/seed/seed_mock_data.sql` | Sửa — thêm dữ liệu mẫu |
| `CLAUDE.md` | Sửa — cập nhật mô tả tính năng |

## Seed Mock Data

Thêm vào `seed_mock_data.sql` khoảng 3–4 dòng mẫu cho các lớp mock, đủ loại (slide, handout, listening, speaking).
