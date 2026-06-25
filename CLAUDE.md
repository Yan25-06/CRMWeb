# CLAUDE.md

Web app điểm danh + học phí cho trung tâm tiếng Anh nhỏ tại Việt Nam.
Stack: React 18 + Vite · Tailwind CSS 3 · Supabase (auth + Postgres) · lucide-react · chart.js
Package: `rollcall-manager` | Display: "Anh Ngữ Ms.Phương" | UI: Navy Blue + White, toàn bộ tiếng Việt

---

## Dev Setup

- `npm run dev` → http://localhost:5173
- `npm run build` → dist/ (base: `/`)
- Env bắt buộc: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Alias `@/` → `src/` (vite.config.js)
- Không có test runner, không có linter cấu hình sẵn

---

## Code Conventions

### Components

- Functional components + hooks. **Ngoại lệ duy nhất:** `ErrorBoundary` (class component).
- Import qua alias `@/`, không relative path dài.
- `clsx()` cho conditional classes, không template literals.
- Dùng component từ `@/components/ui` (Button, Badge, Card, Input, Select, Modal, Toast).
  Không tự tạo button/input mới trừ khi thật cần.

### Styling

- Không hard-code màu hex. Dùng Tailwind navy tokens: `navy-950/900/800/600/50`.
- Chữ trên nền sáng: `navy-500` trở lên. `navy-300/400` chỉ cho icon trang trí/viền.
- Nhãn form: `text-sm font-medium text-navy-700`. Không uppercase với tiếng Việt có dấu.

### Data

- Mọi data đi qua `src/services/*.js`. Không gọi `supabase.*` trực tiếp trong component
  (ngoại lệ: auth trong `useAuth.jsx`).
- Service mới phải có `fromDB(row)` (snake_case → camelCase) và `toDB(data)` (ngược lại).
- Tiền tệ: `new Intl.NumberFormat('vi-VN').format(n) + 'đ'`
- Ngày: `new Date(date).toLocaleDateString('vi-VN')` | Lưu dạng `YYYY-MM-DD`

### Permissions

- Check quyền UI qua `usePermissions()` (`src/hooks/usePermissions.js`).
  Không đọc `teacher.is_admin` trực tiếp trong component.
- RLS ở Postgres là nguồn chân lý bảo mật — `usePermissions` chỉ là lớp UX.

### UX bắt buộc

- Toast feedback sau mọi action (success/error).
- Loading state cho mọi async operation.
- `<Empty />` khi list rỗng.
- Confirm dialog trước khi xóa.

---

## Commit Convention

Format: `type(scope): short description` — tiếng Anh, imperative mood, lowercase.

### Types

| Type       | Dùng khi                                     |
|------------|----------------------------------------------|
| `feat`     | Thêm tính năng mới                           |
| `fix`      | Sửa bug                                      |
| `refactor` | Refactor code, không thêm tính năng/fix bug  |
| `docs`     | Thay đổi tài liệu (CLAUDE.md, README, specs) |
| `chore`    | Maintenance (deps, config, tooling)          |
| `ci`       | CI/CD pipeline                               |
| `style`    | Formatting, không đổi logic                 |

### Scope (tùy chọn)

Tên trang hoặc domain: `fees`, `schedule`, `admin`, `auth`, `services`, `ui`

### Ví dụ

```
feat(schedule): add substitute teacher dropdown
fix(fees): correct monthly fee calculation for surcharge
refactor(services): extract payroll logic to utils
docs: update CLAUDE.md after routing changes
chore: upgrade supabase-js to v2.45
```

### Rules

- Description ≤ 72 ký tự, không kết thúc bằng dấu chấm.
- Body (tùy chọn): giải thích **tại sao**, không phải **cái gì**. Có thể viết tiếng Việt.
- Không dùng `feat: add feature` hay `fix: fix bug` — phải nói rõ cái gì.

---

## Rules cho AI

### Bắt buộc sau mỗi thay đổi kiến trúc

Sau khi sửa/thêm tính năng làm thay đổi: service layer, data model, routing, auth flow,
permission logic, hoặc migration — **cập nhật CLAUDE.md ngay** (phần liên quan).
Không để file này lỗi thời.

### Không làm

- Không mô tả tính năng trong CLAUDE.md — AI đọc code, không đọc mô tả.
- Không thêm comment giải thích WHAT code làm — chỉ comment WHY nếu không hiển nhiên.
- Không thêm error handling cho case không thể xảy ra.
- Không thêm feature, refactor, hay abstraction ngoài scope task.
- Không tạo file documentation mới (*.md) trừ khi được yêu cầu.

### OpenSpec workflow

Thay đổi lớn quản lý qua `openspec/`. Skills: `openspec-propose` → `openspec-apply-change`
→ `openspec-archive-change`. Specs ở `openspec/specs/`, changes ở `openspec/changes/`.

### Seed data

`supabase/seed/seed_mock_data.sql` — chỉ dùng cho dev/test.
Không chạy seed lên production.

---

## Architecture Notes

### Chấm công giáo viên (opt-in, 3 trạng thái)

Bảng `teacher_attendance` — migration `20260625000001_teacher_attendance_optin_substitute_confirm.sql`.

**Mô hình:** Không có record = "Chưa xác nhận" (không tính lương). Mỗi lần bấm chip:
- Chưa xác nhận → Đã dạy (`status='present'`) → Vắng (`status='absent'`) → xóa record (về Chưa xác nhận).

**Quyền chấm công:**
- `canCheckAllAttendance` (= `isAdmin`): admin toggle mọi ca, gán dạy thay.
- `canCheckOwnAttendance` (= mọi teacher, luôn `true`): GV tự chấm buổi lớp mình phụ trách.
- RLS tương ứng: policy `teacher self insert/update/delete` + policy `substitute confirm update`.

**Dạy thay:**
- Admin chọn GV dạy thay qua `SubstituteDropdown` trên ScheduleCard khi status='absent'.
- GV dạy thay thấy danh sách buổi được giao ở section `SubstituteAssignments` (chỉ khi không phải admin); tự xác nhận → `substitute_confirmed=true`.
- Lương tính cho dạy thay **chỉ khi** `substitute_confirmed=true`.

**Công thức lương** (`src/utils/payroll.js`):
- `taught = count(status='present')` — không còn dùng `scheduled - absent`.
- `subs = count(substitute_confirmed=true)` — buổi dạy thay đã xác nhận.
- `pending = scheduled - taught - absent` — buổi chưa xác nhận (cột "Chưa XN" ở PayrollTab).

**Components mới:**
- `src/components/schedule/SubstituteAssignments.jsx` — section "Buổi được giao dạy thay".
- `src/utils/helpers.js` thêm export `fmtDayList(dayList)` — format danh sách thứ thành chuỗi hiển thị.

**SchedulePage — 2 tab:**
- Tab "Lịch Dạy": `WeeklyGrid` + chip chấm công (3 trạng thái) + `SubstituteDropdown` + `SubstituteAssignments` (nếu có buổi dạy thay chưa xác nhận).
- Tab "Bảng Lương" (`PayrollTab.jsx`): bảng tính lương theo tháng; admin xem tất cả GV, GV thường xem của mình. Cột: Lịch dạy, Đã dạy, Vắng, **Chưa XN**, Dạy thay, Lương.

**Admin Panel:** Card mỗi GV có nút "Xem lịch dạy" → expand danh sách lớp + ngày dạy.
