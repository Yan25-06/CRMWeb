# CLAUDE.md

Hướng dẫn cho AI khi làm việc trong repo này. **Đọc file này đầu mỗi session thay vì quét lại toàn bộ project.**

> ⚠️ **QUY TẮC BẮT BUỘC:** Sau khi sửa/thêm tính năng làm thay đổi kiến trúc, data model, service layer, routing, scripts hoặc trạng thái migration — **cập nhật lại file này và file README.md** ở phần liên quan. Giữ nó luôn khớp với code. Đừng để nó lỗi thời 
---

## Dự án là gì
Web app quản lý điểm danh + học phí cho giáo viên/trung tâm tiếng Anh nhỏ tại Việt Nam (IELTS/TOEIC/Giao tiếp). UI Navy Blue + White, toàn bộ tiếng Việt. Tên package: `rollcall-manager`. Tên hiển thị: "Anh Ngữ Ms.Phương".

## Stack
- **React 18 + Vite** (alias `@/` → `src/`, cấu hình trong `vite.config.js`)
- **Tailwind CSS 3** với custom Navy design tokens (`tailwind.config.js`, `src/index.css`)
- **Supabase** (`@supabase/supabase-js`) — auth + Postgres backend (localStorage đã xóa hoàn toàn)
- **lucide-react** (icons), **clsx** (conditional classes)
- **chart.js** + **react-chartjs-2** (biểu đồ), **html2canvas** + **jspdf** (xuất PDF), **xlsx** (xuất Excel)

## Scripts
- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` — build production → **xuất ra `docs/`** (không phải `dist/`), `base: '/RollCallWeb/'` (deploy GitHub Pages)
- `npm run preview`
- Không có test runner, không có linter cấu hình sẵn.

## Env bắt buộc
`.env` cần `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, nếu thiếu `src/lib/supabase.js` sẽ throw.

---

## ⭐ Data Layer: Supabase Service Layer (hoàn tất)

Migration localStorage → Supabase **đã hoàn tất**. Không còn `src/store/db.js`. Toàn bộ data đi qua service layer.

### Nguồn data — `src/services/*.js` (Supabase)
Mỗi service là một object với method `getAll / getById / create / update / remove` (+ method riêng theo domain). Pattern chuẩn (xem `studentService.js`, `classService.js`):
- `fromDB(row)` map snake_case → camelCase; `toDB(data)` map camelCase → snake_case.
- Mọi method `throw new Error(error.message)` khi Supabase lỗi.
- `create` gắn `teacher_id` qua `getUid()` (export từ `studentService.js`), nhưng nếu `data.teacherId` có giá trị → dùng giá trị đó (cho admin gán lớp cho giáo viên khác).
- **UI không gọi `supabase.*` trực tiếp** — luôn qua service (trừ auth trong `useAuth.jsx`).
- **`classService` hỗ trợ admin**: `create()` và `update()` chấp nhận `data.teacherId` tường minh để admin gán/đổi giáo viên phụ trách.

Services đã có: `studentService`, `classService` (+`teacherService`), `enrollmentService`, `sessionService`, `attendanceService`, `homeworkService`, `hwAssignmentService`, `submissionService`, `scheduleService`, `feeService`, `paymentService`, `reviewService`, `sessionReviewService`, `generalCommentService`, `mockTestService`, `mockTestResultService`, `settingsService`.

### Trạng thái migration theo trang
- ✅ **Tất cả trang đã dùng services.** `src/store/db.js` và `src/store/mockTestExport.js` đã bị xóa (cutover hoàn tất, 2026-06-02).
- Offline banner (`src/components/layout/OfflineBanner.jsx`) + retry queue (`src/utils/retryQueue.js`) đã thêm.
- Export mock test functions chuyển sang `src/utils/mockTestExport.js`.

**Khi thêm tính năng mới:** luôn viết qua Supabase service. Tạo service mới theo pattern `fromDB/toDB`.

---

## Auth
- `src/hooks/useAuth.jsx` — `AuthProvider` + `useAuth()`. Cung cấp `user`, `teacher` (profile từ bảng `teachers`), `loading`, `needsPassword`, `login`, `logout`, `completePasswordSetup`.
- **Lưu ý deadlock:** không `await` supabase trong callback `onAuthStateChange` (auth lock). Profile teacher nạp ở `useEffect` riêng theo `user.id`.
- Flow invite/recovery: cờ bắt từ URL hash ngay khi module load (trước khi Supabase xóa hash) → `SetPasswordPage`.
- `src/main.jsx` → `AuthGate`: loading spinner → SetPassword (nếu invite) → `LoginPage` (nếu chưa đăng nhập) → `App`.

## Routing & Layout
- **Không dùng react-router.** Routing là state `page` trong `App.jsx` (`useState` + `switch` trong `renderPage()`).
- Trang: `dashboard`, `fees`, `reports`, `reviews`, `schedule`, `classes`, `settings`, **`admin`** (chỉ khi `is_admin = true`).
- `classes` có 2 chế độ: list (`ClassesOverviewPage`) ↔ detail (`ClassDetailPage`) qua `selectedClassId` (persist trong localStorage).
- `ClassDetailPage` có các tab: Students, Attendance, Homework, MockTest.
- **Admin Panel** (`AdminPanelPage`): route `/admin` (page `'admin'`), hiển thị danh sách giáo viên, form tạo/giao/đổi lớp, xem read-only dữ liệu các giáo viên. Guard với `teacher.is_admin` (redirect về dashboard nếu không phải admin). Link "Admin" chỉ hiện trong Navbar khi `is_admin = true`.
- Month/year picker ở top bar chỉ hiện cho trang `dashboard` và `fees`.
- Layout: `Navbar` (sidebar/mobile nav) bên trái + main content, `ToastContainer` global.

## Cấu trúc thư mục
```
src/
├── components/
│   ├── ui/index.jsx        ← thư viện UI dùng chung (xem dưới)
│   ├── layout/Navbar.jsx
│   ├── attendance/ classes/ fees/ homework/ mock-test/ reviews/ schedule/ students/ reports/
├── pages/
│   ├── DashboardPage / FeesPage / ReportsPage / ReviewsPage / SchedulePage / SettingsPage
│   ├── LoginPage / SetPasswordPage / PlaceholderPages
│   ├── AdminPanelPage.jsx  ← Admin Panel (tạo/giao lớp, xem read-only data)
│   └── ClassDetailPage/ (index.jsx + tabs/)
├── services/   ← Supabase service layer (toàn bộ data)
├── hooks/useAuth.jsx, useOnlineStatus.js
├── lib/supabase.js
├── utils/      ← helpers, useDebounce, scheduleConflict, retryQueue, mockTestExport
├── App.jsx / main.jsx / index.css
```

---

## Quy ước code (BẮT BUỘC)
### Style
- Functional components + hooks. Không class components.
- Import qua alias `@/`, không relative path dài.
- `clsx()` cho conditional classes, **không** template literals cho class.

### Design system
- **KHÔNG hard-code màu hex** trong component. Dùng Tailwind navy tokens: `bg-navy-800`, `text-navy-900`, `bg-navy-50`...
- Dùng component từ `@/components/ui`: `Button`, `Badge`, `Card`, `Input`, `Select`, `Modal`, `Toast`/`ToastContainer` (+ `StatCard`, `Empty` nếu có). Không tự tạo button/input mới trừ khi thật cần.
- Navy tokens chính: navy-950 `#06142B`, navy-900 `#0F2044` (sidebar/header), navy-800 `#1B3A6B` (primary), navy-600 `#2E5FA3` (accent), navy-50 `#E8EEF7` (hover).

### Data & format
- Đọc/ghi data qua service layer — **không gọi `supabase.*` trực tiếp trong component** (trừ auth trong `useAuth.jsx`).
- Tiền tệ: `new Intl.NumberFormat('vi-VN').format(n) + 'đ'`
- Ngày: `new Date(date).toLocaleDateString('vi-VN')`; lưu dạng `YYYY-MM-DD`.

### UX
- Toast feedback sau mỗi action (success/error).
- Loading state cho mọi async.
- Empty state khi list rỗng (`<Empty />`).
- Confirm trước khi xóa.

---

## OpenSpec workflow
Project quản lý thay đổi qua OpenSpec (`openspec/`). Có skill tích hợp: `openspec-propose`, `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`.
- `openspec/specs/` — spec hiện hành (đã build). `openspec/changes/` — change đang làm; `openspec/changes/archive/` — đã xong.
- `openspec/ROADMAP.md` — lộ trình migration Supabase multi-teacher (nguồn chân lý cho thứ tự các change service layer).
- Change đang mở (chưa archive): `add-supabase-multi-teacher` (reference gốc — có thể xóa sau khi confirm `add-admin-panel` hoạt động).
- Đã archive: `add-service-fees` (2026-06-02), `add-service-reviews` (2026-06-02), `add-service-tests-settings` (2026-06-03), `add-admin-panel` (2026-06-03), **`add-class-skill-config` (2026-06-03)**.
- Một change gồm `proposal.md`, `design.md`, `specs/`, `tasks.md`. Implement theo tasks, check `[x]` khi xong, không làm ngoài scope.
- **Lộ trình multi-teacher hoàn tất**: tất cả service layer sẵn sàng, admin panel đã triển khai, mời giáo viên qua Supabase Dashboard.

## Quyết định kiến trúc đã chốt (từ ROADMAP)
- RLS enforce ở PostgreSQL, **không** filter quyền ở frontend.
- Admin read-only = không cấp policy ghi cho admin ở DB.
- Invite giáo viên qua Supabase Dashboard; DB trigger tự tạo row `teachers` — không dùng Edge Function.
- Optimistic UI + retry (không offline-first thật).

## Model đánh giá kỹ năng (đã chốt — migration 20260603000001)
- **`classes.skill_config`** (jsonb): mảng `[{ name, maxScore, order }]` định nghĩa kỹ năng của lớp. Default IELTS 4 kỹ năng thang 0–9.
- **`reviews.scores`** (jsonb): keyed theo tên kỹ năng `{ "Listening": 7.5, "Reading": 6.0 }`. Không còn 4 cột cố định.
- **`DEFAULT_SKILL_CONFIG`** export từ `classService.js` — dùng làm fallback ở service + UI.
- `ClassModal`: tái dùng `MockTestSectionBuilder` để chỉnh tên/điểm tối đa kỹ năng.
- `ReviewForm`: render ô nhập điểm động theo `skillConfig` của lớp, validate `0..maxScore`.
- `RadarChartPanel`: chuẩn hóa điểm về % (`value/maxScore*100`), trục `r` cố định 0–100.
- `MockTestModal`: khi tạo mới, init sections từ `skillConfig` của lớp.
- Các component nhận `skillConfig` qua prop (truyền từ `selectedClass.skillConfig` ở page level).

## Model học phí (đã chốt)
- **Không tính theo buổi.** Học phí là cố định: theo tháng hoặc theo khóa.
- `enrollments.fee_type`: `'monthly'` (mặc định) | `'course'`
- `enrollments.monthly_fee`: học phí tháng (VNĐ) — dùng khi `fee_type = 'monthly'`
- `enrollments.course_fee`: học phí cả khóa (VNĐ) — dùng khi `fee_type = 'course'`
- Công thức `calcFee`: `monthly` → `monthly_fee + surcharge`; `course` → `course_fee`
- `fees.surcharge`: phụ phí tháng (upsert qua `feeService.upsert`), chỉ áp dụng cho `monthly`
- **Không còn cột `fee_per_session`** trên bất kỳ bảng nào (đã xóa qua migration `20260602000003`)
- UI đặt học phí: `EnrollmentModal` (toggle "Theo tháng / Theo khóa")

---
