# Kiến trúc dự án — Anh Ngữ Ms.Phương (`rollcall-manager`)

Tài liệu giải thích **cách dự án được tổ chức và vận hành**, dành cho người mới đọc để hiểu tổng thể trước khi sửa code. Chi tiết quy ước code và trạng thái migration nằm ở `CLAUDE.md`; runbook deploy ở `DEPLOYMENT.md`.

---

## 1. Tổng quan

Web app **quản lý điểm danh + học phí** cho một trung tâm tiếng Anh nhỏ (IELTS/TOEIC/Giao tiếp) tại Việt Nam. Một admin (chủ trung tâm) + nhiều giáo viên. Toàn bộ UI tiếng Việt, theme Navy Blue + White.

Bản chất là một **SPA React thuần (client-only)**, không có backend riêng của ứng dụng — mọi nghiệp vụ dữ liệu đi thẳng tới **Supabase** (Postgres + Auth). Bảo mật thực sự nằm ở **Row Level Security (RLS)** trong Postgres; frontend chỉ là lớp UX.

```
┌─────────────────────────────────────────────┐
│  Browser (SPA React + Vite)                 │
│                                             │
│  Pages ──► Components ──► Service layer ────┼──► Supabase
│              ▲                │             │     ├─ Auth (JWT)
│              │                ▼             │     └─ Postgres + RLS
│         usePermissions   @/lib/supabase     │
│         useAuth                             │
└─────────────────────────────────────────────┘
```

Không có server Node, không có API riêng. Deploy ra **GitHub Pages** (static, build vào `docs/`).

---

## 2. Stack & công cụ

| Lớp | Công nghệ |
|-----|-----------|
| Build | Vite 5, `@vitejs/plugin-react`, alias `@/` → `src/` |
| UI | React 18 (functional + hooks), Tailwind CSS 3 (Navy design tokens) |
| Backend-as-a-Service | Supabase (`@supabase/supabase-js`) — Auth + Postgres |
| Icons / utils | lucide-react, clsx |
| Biểu đồ | chart.js + react-chartjs-2 |
| Xuất file | xlsx (Excel), jspdf + html2canvas (PDF) — lazy-load trong handler |

**Scripts:** `npm run dev` (port 5173), `npm run build` (→ `docs/`, base `/RollCallWeb/`), `npm run preview`. Không có test runner, không có linter cấu hình sẵn.

**Env bắt buộc:** `.env` cần `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Thiếu → `src/lib/supabase.js` throw ngay khi load.

---

## 3. Sơ đồ tầng (layers)

Dữ liệu chảy một chiều, mỗi tầng chỉ gọi tầng ngay dưới:

```
Pages  (src/pages/*)            ← một "màn hình", quản state điều phối + gọi service
  │
Components (src/components/*)   ← UI thuần, nhận data + callback qua props
  │
Service layer (src/services/*) ← NƠI DUY NHẤT chạm Supabase nghiệp vụ
  │
@/lib/supabase                 ← singleton client
  │
Supabase (Postgres + RLS)
```

**Quy tắc vàng:** UI **không bao giờ** gọi `supabase.*` trực tiếp cho nghiệp vụ — luôn qua service. Ngoại lệ duy nhất là **auth** (`useAuth.jsx` gọi `supabase.auth.*` trực tiếp).

---

## 4. Service layer (trái tim của data)

Mỗi domain có một file `src/services/<domain>Service.js` export một object. Tổng cộng 17 service:

`studentService`, `classService` (+`teacherService`), `enrollmentService`, `sessionService`, `attendanceService`, `homeworkService`, `hwAssignmentService`, `submissionService`, `scheduleService`, `feeService`, `paymentService`, `reviewService`, `sessionReviewService`, `generalCommentService`, `mockTestService`, `mockTestResultService`, `settingsService`.

### Pattern chuẩn của một service

```js
import { supabase } from '@/lib/supabase'

// 1. Map DB (snake_case) → app (camelCase)
const fromDB = (row) => row ? { id: row.id, studentId: row.student_id, ... } : null
// 2. Map app (camelCase) → DB (snake_case)
const toDB = (data) => ({ student_id: data.studentId, ... })

export const xxxService = {
  async getAll()        { /* select → .map(fromDB) */ },
  async getById(id)     { /* select single → fromDB */ },
  async create(data)    { /* gắn teacher_id qua getUid(), insert, fromDB */ },
  async update(id, data){ /* update */ },
  async remove(id)      { /* delete */ },
  // + method riêng theo domain
}
```

Quy ước nhất quán:
- **`fromDB` / `toDB`** chuyển đổi naming — UI luôn làm việc với camelCase, DB luôn snake_case.
- Mọi lỗi Supabase → `throw new Error(error.message)`.
- **Gắn chủ sở hữu:** `create()` set `teacher_id = data.teacherId ?? await getUid()`. `getUid()` (export từ `studentService.js`) lấy user id từ session. Truyền `teacherId` tường minh cho phép **admin gán dữ liệu cho giáo viên khác**.

### Ví dụ nghiệp vụ phức tạp: `feeService`

Không chỉ CRUD — chứa logic tính học phí:
- `calcFee(studentId, year, month)`: `monthly` → `monthly_fee + surcharge`; `course` → `course_fee`. **Không tính theo buổi.**
- `buildFeesRows(year, month)`: bulk-load cho `FeesPage` — chỉ **3 query** (enrollments + students/classes join, fees để lấy surcharge, payments theo kỳ), group theo học viên. Cùng công thức dùng lại ở Admin Panel để đếm "HS chưa đóng phí".

---

## 5. Auth & phân quyền

### Luồng xác thực — `src/hooks/useAuth.jsx`

`AuthProvider` (React Context) cung cấp: `user`, `teacher` (profile từ bảng `teachers`), `loading`, `needsPassword`, `login`, `logout`, `completePasswordSetup`, `updateTeacherName`, `requestPasswordReset`.

Chi tiết then chốt:
- **Không deadlock:** tuyệt đối **không `await` supabase trong callback `onAuthStateChange`** (vướng auth lock). Profile teacher nạp ở `useEffect` riêng theo `user.id`.
- **Invite / recovery:** cờ `type=invite` / `type=recovery` bắt từ URL hash **ngay khi module load** (trước khi Supabase xóa hash) → bật `needsPassword` → render `SetPasswordPage`.
- **Quên mật khẩu:** `requestPasswordReset` gọi `resetPasswordForEmail` với `redirectTo = origin + BASE_URL`.
- **Tên hiển thị giáo viên** lưu duy nhất ở `teachers.name` (không ở bảng `settings`).

Cây bootstrap trong `src/main.jsx`:
```
ErrorBoundary
  └─ AuthProvider
       └─ AuthGate   → loading spinner
                      → SetPasswordPage (nếu invite/recovery)
                      → LoginPage       (nếu chưa đăng nhập)
                      → App             (đã đăng nhập)
```
`ErrorBoundary` (`src/components/ErrorBoundary.jsx`) là **class component** — ngoại lệ hợp lệ duy nhất với quy tắc "chỉ functional" — bắt lỗi render toàn cục → màn hình khôi phục tiếng Việt.

### Phân quyền hai tầng

1. **Tầng UX (client) — `src/hooks/usePermissions.js`**
   Nguồn chân lý gating UI. Component **không đọc `teacher.is_admin` trực tiếp**, mà gọi `usePermissions()` lấy cờ ngữ nghĩa: `isAdmin`, `canViewFees`, `canAccessAdmin`, `canManageStudents`, `canCreateMockTest`, `canManageClasses`, `canFilterByTeacher`... Hiện tất cả = `isAdmin`; muốn đổi rule chỉ sửa một dòng trong hook.

2. **Tầng bảo mật (server) — RLS ở Postgres**
   Đây mới là nguồn chân lý thật. UI ẩn nút chỉ để UX, không thay thế RLS. Tóm tắt rule:
   - **Giáo viên thường:** đọc/ghi dữ liệu nghiệp vụ của chính mình (điểm danh, bài tập, nhận xét, enrollment, nhập điểm mock test). **Read-only** với `students` và `mock_tests` (đề). **Không thấy** mục Học Phí (ẩn ở UI).
   - **Admin:** toàn quyền INSERT/UPDATE/DELETE trên **mọi** bảng (không giới hạn `teacher_id`) — admin cũng đứng lớp; cộng thêm Admin Panel + Học Phí + cài đặt trung tâm.

   UI khớp DB qua prop `isAdmin` truyền từ `App.jsx` xuống các trang/tab liên quan (StudentsDirectory, ClassDetail → StudentsTab/MockTestTab → con).

---

## 6. Routing & layout

**Không dùng react-router.** Điều hướng là **state `page`** trong `App.jsx` (`useState` + `switch` trong `renderPage()`).

Các trang: `dashboard`, `fees` (chỉ admin), `reports`, `reviews`, `schedule`, `classes`, `students`, `settings`, `admin` (chỉ admin).

- **Guard route:** `handleNavigate` + `currentPage` chặn `admin`/`fees` về `dashboard` nếu không phải admin (dùng `usePermissions`).
- **`classes` có 2 chế độ:** list (`ClassesOverviewPage`) ↔ detail (`ClassDetailPage`) qua `selectedClassId` (persist trong `localStorage`). `ClassDetailPage` có tab Students / Attendance / Homework / MockTest; prop `initialTab` cho phép mở thẳng tab (vd Dashboard → Attendance).
- **Top bar month/year picker** chỉ hiện cho `dashboard` và `fees`; state `year`/`month` ở `App.jsx` truyền xuống.
- **Layout:** `Navbar` (sidebar trái / mobile nav) + main content + `ToastContainer` global + `OfflineBanner`.

---

## 7. Cấu trúc thư mục

```
src/
├── components/
│   ├── ui/index.jsx        ← thư viện UI dùng chung: Button, Badge, Card, Input,
│   │                          Select, Modal, Toast/ToastContainer, StatCard, Empty
│   ├── layout/             ← Navbar, OfflineBanner
│   └── attendance/ classes/ fees/ homework/ mock-test/ reviews/
│       schedule/ students/ reports/   ← component theo domain
├── pages/                  ← một file = một màn hình
│   ├── DashboardPage / FeesPage / ReportsPage / ReviewsPage / SchedulePage
│   ├── SettingsPage / LoginPage / SetPasswordPage / PlaceholderPages
│   ├── AdminPanelPage      ← stat cards + tạo/giao/đổi lớp cho giáo viên
│   ├── StudentsDirectoryPage  ← danh bạ học viên tổng (lọc, tìm, import Excel)
│   ├── ClassesOverviewPage
│   └── ClassDetailPage/ (index.jsx + tabs/)
├── services/               ← Supabase service layer (TOÀN BỘ data nghiệp vụ)
├── hooks/                  ← useAuth.jsx, usePermissions.js, useOnlineStatus.js
├── lib/supabase.js         ← Supabase client singleton
├── utils/                  ← helpers, useDebounce, scheduleConflict, retryQueue, mockTestExport
├── App.jsx                 ← root: routing state + layout + month/year
├── main.jsx                ← bootstrap: ErrorBoundary > AuthProvider > AuthGate
└── index.css               ← Tailwind + Navy tokens
```

---

## 8. Mô hình dữ liệu (data model)

Schema sống ở `supabase/migrations/*.sql` (đánh số theo ngày). Các thực thể chính và quan hệ:

```
teachers (1) ─┬─< students          (teacher_id)
              ├─< classes           (teacher_id, skill_config jsonb)
              └─< ... (mọi bảng nghiệp vụ scope theo teacher_id)

students (N) ──< enrollments >── (N) classes     ← bảng nối, giữ học phí + mục tiêu
classes  (1) ──< sessions ──< attendance
classes  (1) ──< homeworks ──< hw_assignments ──< submissions
students (1) ──< fees / payments
students (1) ──< reviews (scores jsonb) / session_reviews / general_comments
classes  (1) ──< mock_tests ──< mock_test_results
settings (theo teacher)
```

Các quyết định mô hình đáng lưu ý:

- **Học phí cố định, KHÔNG theo buổi.** `enrollments.fee_type` = `'monthly'` | `'course'`. `monthly_fee` / `course_fee`. `fees.surcharge` là phụ phí tháng (chỉ cho `monthly`). Đã xóa hẳn cột `fee_per_session`.
- **Kỹ năng linh hoạt theo lớp.** `classes.skill_config` (jsonb): `[{ name, maxScore, order }]`, default IELTS 4 kỹ năng thang 0–9. `reviews.scores` (jsonb) keyed theo tên kỹ năng — không còn 4 cột cố định. `DEFAULT_SKILL_CONFIG` export từ `classService.js`.
- **Tạo teacher tự động.** Invite giáo viên qua Supabase Dashboard → DB trigger (`handle_new_user`) tự tạo row `teachers`. Không dùng Edge Function.
- **`students.email`** nullable; học sinh có thể tạo không cần lớp.

### Seed & migrations
- `supabase/migrations/` — schema chính + RLS. **Đổi schema phải đồng bộ** service `fromDB/toDB` và file seed.
- `supabase/seed/seed_mock_data.sql` — bộ dữ liệu mẫu đầy đủ để test, **idempotent**, chạy trong SQL Editor (bypass RLS). Không chạy lên production.

---

## 9. Khả năng chịu lỗi & offline

- **`useOnlineStatus` + `OfflineBanner`** — báo mất mạng.
- **`retryQueue`** (`src/utils/retryQueue.js`) — hàng đợi retry cho ghi thất bại. Mô hình là **optimistic UI + retry**, *không* phải offline-first thật.
- **Toast feedback** sau mỗi action (success/error), loading state cho mọi async, empty state (`<Empty />`) khi list rỗng, confirm trước khi xóa.
- **Lazy-load export:** `xlsx`/`jspdf`/`html2canvas` `await import()` trong handler để giảm bundle khởi động.

---

## 10. Bản đồ nhanh "muốn sửa X thì vào đâu"

| Muốn làm | Vào đâu |
|----------|---------|
| Thêm field cho học sinh | migration SQL + `studentService` (`fromDB`/`toDB`) + `StudentModal` |
| Thêm một màn hình mới | tạo `pages/XxxPage.jsx`, thêm case vào `renderPage()` + item Navbar |
| Đổi quy tắc phân quyền UI | `src/hooks/usePermissions.js` (một chỗ duy nhất) |
| Đổi quy tắc bảo mật thật | migration RLS trong `supabase/migrations/` |
| Sửa cách tính học phí | `feeService.calcFee` / `buildFeesRows` |
| Thêm nguồn data mới | tạo `services/xxxService.js` theo pattern `fromDB/toDB` |
| Sửa luồng đăng nhập | `src/hooks/useAuth.jsx` + `main.jsx` (AuthGate) |
| Đổi màu/định dạng | Navy tokens trong `tailwind.config.js` + `src/index.css`; component `@/components/ui` |

---

## 11. Quy ước bắt buộc (tóm tắt — chi tiết ở `CLAUDE.md`)

- Functional components + hooks (ngoại lệ: `ErrorBoundary`). Import qua alias `@/`. `clsx()` cho conditional class, không template literal.
- **Không hard-code màu hex** — dùng Navy tokens (`bg-navy-800`, `text-navy-900`...). Chữ nội dung trên nền sáng dùng `navy-500`+.
- **Không gọi `supabase.*` trực tiếp trong component** (trừ auth).
- Tiền tệ: `Intl.NumberFormat('vi-VN').format(n) + 'đ'`. Ngày lưu `YYYY-MM-DD`, hiển thị `toLocaleDateString('vi-VN')`.
- Quản lý thay đổi lớn qua **OpenSpec** (`openspec/`).
- **Sau thay đổi kiến trúc/data model/service/routing → cập nhật `CLAUDE.md` + `README.md`.**
```
