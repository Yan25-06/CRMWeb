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
- **chart.js** + **react-chartjs-2** (biểu đồ), **html2canvas** + **jspdf** (xuất PDF), **xlsx** (xuất Excel), **jszip** (xuất phiếu hàng loạt zip)

## Scripts
- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` — build production → **xuất ra `docs/`** (không phải `dist/`), `base: '/RollCallWeb/'` (deploy GitHub Pages)
- `npm run preview`
- Không có test runner, không có linter cấu hình sẵn.

## Env bắt buộc
`.env` cần `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, nếu thiếu `src/lib/supabase.js` sẽ throw.

## Mock Seed Data
- **File:** `supabase/seed/seed_mock_data.sql`
- **Mục đích:** Dựng bộ dữ liệu mẫu đầy đủ (10 học viên, 4 lớp, 9 enrollment, 12 session, điểm danh, bài tập, học phí, đánh giá, mock test...) để test mọi tính năng.
- **Cách chạy:** Điền 3 placeholder email (`<<TEACHER_1_EMAIL>>`, `<<TEACHER_2_EMAIL>>`, `<<TEACHER_ADMIN_EMAIL>>`), rồi dán toàn bộ file vào **Supabase SQL Editor** và Run (phải dùng SQL Editor để bypass RLS).
- **Idempotent:** Chạy lại nhiều lần an toàn — cleanup tự động scope theo teacher mock trước khi insert.
- **ĐỒNG BỘ:** Nếu đổi schema (thêm cột NOT NULL, đổi CHECK, đổi shape jsonb) thì phải cập nhật file seed cho khớp.

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
- `src/hooks/useAuth.jsx` — `AuthProvider` + `useAuth()`. Cung cấp `user`, `teacher` (profile từ bảng `teachers`), `loading`, `needsPassword`, `login`, `logout`, `completePasswordSetup(name)`, `updateTeacherName(name)`, `requestPasswordReset(email)`.
- **Quên mật khẩu:** `LoginPage` có 2 chế độ (`login` ↔ `forgot`). Chế độ forgot gọi `requestPasswordReset(email)` → `supabase.auth.resetPasswordForEmail` với `redirectTo = origin + import.meta.env.BASE_URL`. Luôn hiện thông báo xác nhận chung (chống dò tài khoản). Mở link reset → cờ `type=recovery` → `SetPasswordPage` (tái dùng luồng invite).
- **Lưu ý deadlock:** không `await` supabase trong callback `onAuthStateChange` (auth lock). Profile teacher nạp ở `useEffect` riêng theo `user.id`.
- Flow invite/recovery: cờ bắt từ URL hash ngay khi module load (trước khi Supabase xóa hash) → `SetPasswordPage`.
- `SetPasswordPage`: form có 3 ô — **Tên hiển thị** (bắt buộc), Mật khẩu mới, Xác nhận mật khẩu. Khi submit thành công gọi `onDone(name)` = `completePasswordSetup(name)`.
- `completePasswordSetup(name)`: ghi `teachers.name` vào DB, refresh `teacher` state, tắt cờ `needsPassword`, dọn URL hash.
- Hiển thị danh tính: `teacher?.name || user.email` — `Navbar` đã đúng pattern này. Giáo viên cũ chưa có tên sẽ fallback email.
- `src/main.jsx` → `ErrorBoundary` bọc `AuthProvider` + `AuthGate`: loading spinner → SetPassword (nếu invite) → `LoginPage` (nếu chưa đăng nhập) → `App`.
- **ErrorBoundary** (`src/components/ErrorBoundary.jsx`): class component (ngoại lệ hợp lệ với quy tắc "chỉ functional") bắt lỗi render toàn cục → màn hình khôi phục tiếng Việt + nút "Tải lại trang"; vẫn `console.error` stack để debug.

## Triển khai production
- Runbook bắt buộc trước go-live ở **`DEPLOYMENT.md`** (root, KHÔNG đặt trong `docs/` vì `docs/` là output build): bootstrap admin (`is_admin` set qua SQL Editor), cấu hình Auth Site/Redirect URL, tắt tự đăng ký, bật backup, kiểm thử tài khoản giáo viên thường. KHÔNG chạy seed mock lên production.
- **Lazy-load export:** `xlsx`/`jspdf`/`html2canvas`/`jszip` dùng `await import()` trong handler (giảm bundle khởi động), bọc try/catch + `toast.error`. Áp dụng ở `ExportExcelButton`, `ExportPdfButton`, `mockTestExport.js`, `ClassOverviewTable`, `ImportStudentsModal`, `BulkExportModal`.

## Routing & Layout
- **Không dùng react-router.** Routing là state `page` trong `App.jsx` (`useState` + `switch` trong `renderPage()`). State điều hướng (`page` + `selectedClassId`) được đồng bộ vào browser history qua History API (`pushState`/`replaceState`/`popstate`) — nút **Back/Forward** của browser hoạt động trong phạm vi app mà không đổi URL và không thêm thư viện.
- Trang: `dashboard`, `fees`, `reports`, `reviews`, `schedule`, `classes`, `settings`, **`admin`** (chỉ khi `is_admin = true`), **`students`** (danh bạ học viên).
- `classes` có 2 chế độ: list (`ClassesOverviewPage`) ↔ detail (`ClassDetailPage`) qua `selectedClassId` (persist trong localStorage).
- `ClassDetailPage` có các tab: Students, Attendance, Homework, MockTest. Prop `initialTab` (default `'students'`) cho phép mở thẳng tab Attendance từ Dashboard. Truyền `scheduleTime={currentClass?.scheduleTime}` vào `AttendanceTab` và `HomeworkTab`; các tab tiếp tục truyền prop này vào `SessionModal` để tự điền giờ khi tạo buổi mới.
- **Dashboard** (`DashboardPage`): prop `onAttendance(classId)` từ `App.jsx` → đặt `selectedClassId` + `classInitialTab='attendance'` + mở trang `classes`. Card "Lịch hôm nay" dùng `DailyAgenda`, stat card "Chưa đóng phí" thay thế "Năm học" — click → `FeesPage`.
- **Admin Panel** (`AdminPanelPage`): route `/admin` (page `'admin'`), dải 4 `StatCard` tổng quan (Tổng học viên, Lớp đang hoạt động, Số giáo viên, HS chưa đóng phí tháng hiện tại — số chưa đóng dùng cùng công thức `feeService.buildFeesRows` rồi đếm `paid < expected`) + danh sách giáo viên + form tạo/giao/đổi lớp. Guard với `teacher.is_admin` (redirect về dashboard nếu không phải admin). Link "Admin" chỉ hiện trong Navbar khi `is_admin = true`.
- **FeesPage** có thêm bộ chọn lớp (`classFilter`, mặc định `'all'`), lọc client-side trước bộ lọc trạng thái; `tabCounts`, summary cards và `exportRows` đều phản ánh lớp đang chọn.
- **Mục "Học Phí" chỉ admin**: Navbar lọc bỏ item `fees` khi `!isAdmin`; `App.jsx` `handleNavigate` + `currentPage` chặn route `fees` về `dashboard` nếu không phải admin (cùng cơ chế guard `admin`).
- **Students Directory** (`StudentsDirectoryPage`): route `students`, danh bạ tổng tất cả học sinh, lọc theo trạng thái/lớp/loại khóa, tìm kiếm, thêm nhanh, import Excel, bulk delete, sidebar chi tiết, điều hướng đến lớp. Prop `onNavigateToClass(classId)` từ `App.jsx`.
- **Reports** (`ReportsPage`): 4 card báo cáo — Điểm Danh, Mock Test, Học Phí, Bài Tập. Bộ chọn lớp **chung** ở đầu trang áp dụng cho mọi card; filter khoảng tháng / học viên giữ cục bộ trong từng card. MockTestCard hiển thị toàn bộ học sinh (không giới hạn 5), legend ẩn/hiện series. Card Bài Tập dùng `homeworkService.getByClass` + `sessionService.getByClass`, vẽ grouped bar "Tổng giao / Hoàn thành" theo tháng. Card Điểm Danh và Học Phí hỗ trợ drill-down: click cột tháng → Modal bảng chi tiết buổi/học viên (Điểm Danh) hoặc danh sách thanh toán (Học Phí). Mọi card có `ExportButtons` (Excel + PDF).
- **Settings** (`SettingsPage`): route `settings`, 3 section dùng pattern **edit button** (read-only mặc định → "Chỉnh sửa" → Lưu/Hủy, mỗi section có edit state riêng). (1) **Tài khoản cá nhân** (mọi user): tên hiển thị ghi vào `teachers.name` qua `useAuth().updateTeacherName(name)`, email read-only. (2) **Đổi Mật Khẩu** (mọi user): xác minh mật khẩu cũ qua `supabase.auth.signInWithPassword` rồi `supabase.auth.updateUser({ password })`; mật khẩu mới ≥6 ký tự + khớp xác nhận. (3) **Thông Tin Trung Tâm** (chỉ `teacher.is_admin`): tên trung tâm qua `settingsService.get/upsert`.
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
│   ├── AdminPanelPage.jsx  ← Admin Panel (stat cards + tạo/giao lớp; admin toàn quyền ghi)
│   ├── StudentsDirectoryPage.jsx  ← Danh bạ học viên tổng (lọc, tìm, import Excel)
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
- Functional components + hooks. Không class components (**ngoại lệ:** `ErrorBoundary` bắt buộc class theo React).
- Import qua alias `@/`, không relative path dài.
- `clsx()` cho conditional classes, **không** template literals cho class.

### Design system
- **KHÔNG hard-code màu hex** trong component. Dùng Tailwind navy tokens: `bg-navy-800`, `text-navy-900`, `bg-navy-50`...
- Dùng component từ `@/components/ui`: `Button`, `Badge`, `Card`, `Input`, `Select`, `Modal`, `Toast`/`ToastContainer` (+ `StatCard`, `Empty` nếu có). Không tự tạo button/input mới trừ khi thật cần.
- Navy tokens chính: navy-950 `#06142B`, navy-900 `#0F2044` (sidebar/header), navy-800 `#1B3A6B` (primary), navy-600 `#2E5FA3` (accent), navy-50 `#E8EEF7` (hover).
- **Tương phản (WCAG AA):** `navy-400` (`#3F77BF`) và `navy-300` (`#5B90C8`) đã đậm hóa để chữ trên nền trắng đạt ≥4.5:1. **Chữ nội dung/nhãn trên nền sáng dùng `navy-500` trở lên**; `navy-300/400` chỉ cho icon trang trí, viền, placeholder. Trên nền tối (sidebar navy-900) chữ inactive dùng `navy-300` (không dùng `navy-400` — tương phản thấp).
- **Nhãn form:** kiểu chuẩn là `text-sm font-medium text-navy-700` (KHÔNG uppercase — khó đọc tiếng Việt có dấu). `Input`/`Select` đã theo kiểu này; form viết tay cũng vậy. `uppercase tracking-wide` chỉ dùng cho tiêu đề mục / header bảng, không cho nhãn field.
- **A11y:** `Modal` đóng bằng Esc, khóa scroll nền, focus-trap, có `role="dialog"`/`aria-modal`. `Toast` hỗ trợ nhiều thông báo xếp chồng, có `role="alert"` + `aria-live`; gọi qua API `toast.success/error/info`.

### Phân quyền UI (BẮT BUỘC)
- **Check quyền của người dùng hiện tại qua `usePermissions()`** (`src/hooks/usePermissions.js`) — **KHÔNG đọc `teacher.is_admin` trực tiếp trong component**. Hook là nguồn chân lý gating UI ở client, trả về cờ ngữ nghĩa theo năng lực: `isAdmin`, `canViewFees`, `canAccessAdmin`, `canManageCenterSettings`, `canManageStudents`, `canCreateMockTest`, `canManageClasses`, `canFilterByTeacher` (hiện tất cả = `isAdmin`, đổi rule chỉ sửa một dòng trong hook).
- Đây chỉ là lớp UX — **RLS ở Postgres vẫn là nguồn chân lý bảo mật**, không thay thế.
- **Ngoại lệ (KHÔNG dùng hook):** thao tác dữ liệu trên `is_admin` của *giáo viên khác* (vd `classService.setAdmin`, `AdminPanelPage` toggle `t.is_admin` trong danh sách) và prop ngữ cảnh `isAdmin` của component tái dùng (`ClassModal`, AdminPanel truyền `true` cứng) — đây là dữ liệu/ngữ cảnh, không phải quyền của caller.

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
- Đã archive: `add-service-fees` (2026-06-02), `add-service-reviews` (2026-06-02), `add-service-tests-settings` (2026-06-03), `add-admin-panel` (2026-06-03), **`add-class-skill-config` (2026-06-03)**, **`improve-review-fee-ux` (2026-06-07)**.
- Một change gồm `proposal.md`, `design.md`, `specs/`, `tasks.md`. Implement theo tasks, check `[x]` khi xong, không làm ngoài scope.
- **Lộ trình multi-teacher hoàn tất**: tất cả service layer sẵn sàng, admin panel đã triển khai, mời giáo viên qua Supabase Dashboard.

## Quyết định kiến trúc đã chốt (từ ROADMAP)
- RLS enforce ở PostgreSQL, **không** filter quyền ở frontend.
- **Admin toàn quyền ghi** (migration `20260604000001_admin_full_write_access.sql`): admin có INSERT/UPDATE/DELETE trên TẤT CẢ bảng nghiệp vụ (không giới hạn `teacher_id`) — admin cũng đứng lớp như giáo viên. Cách làm: thêm policy admin **độc lập** điều kiện `is_admin()` song song policy teacher (Postgres OR-combine permissive policy → policy teacher giữ nguyên). `classes` đã có policy admin write từ trước nên KHÔNG thêm lại. Rollback = drop riêng các policy `"<table>: admin insert/update/delete"`.
- **Teacher read-only `students` + `mock_tests`** (migration `20260605000001_restrict_teacher_students_mocktests.sql`): giáo viên thường **mất** INSERT/UPDATE/DELETE trên bảng `students` và `mock_tests` (đề Mock Test), chỉ còn SELECT. Drop 3 policy `"students: teacher insert/update/delete"` + 3 policy `"mock_tests: teacher insert/update/delete"`; giữ policy SELECT của teacher và toàn bộ policy admin. `mock_test_results` (nhập điểm) và mọi bảng nghiệp vụ khác (điểm danh, bài tập, nhận xét, `enrollments`...) **không đổi** — teacher vẫn ghi được. Rollback = re-create 6 policy đã drop (nội dung gốc trong `20260602000001`).
  - **UI khớp DB qua prop `isAdmin`**: `App.jsx` truyền `isAdmin={teacher?.is_admin}` xuống `StudentsDirectoryPage` và `ClassDetailPage` → `StudentsTab`/`MockTestTab` → con (`StudentSidebar`, `StudentDetailPanel`, `MockTestCard`, `EnrollmentModal`). Khi `!isAdmin`: ẩn mọi nút thêm/sửa/xóa học sinh (quick-add, "Thêm học sinh", Import Excel, bulk delete + checkbox chọn, nút Sửa ở sidebar/`StudentDetailPanel`) và nút tạo/sửa/xóa đề Mock Test; **giữ** nhập điểm, điểm danh, bài tập, đổi trạng thái/sửa enrollment.
  - **Ghi danh (`EnrollmentModal`)**: khi `!isAdmin` ẩn toggle "Tạo học viên mới" → giáo viên chỉ gắn học sinh **đã tồn tại** vào lớp (admin phải tạo học sinh trước). Chế độ `edit` chỉ sửa field enrollment (status, học phí, mục tiêu, ghi chú), không đụng bảng `students`.
- **Học phí ẩn với giáo viên ở tầng UI** (không ở DB): Navbar ẩn mục "Học Phí" và `App.jsx` chặn route `fees` khi `!is_admin`. Policy SELECT `fees`/`payments` của teacher vẫn còn → nếu cần chặn thật phải drop ở change sau.
- `studentService.create()` và `classService.create()` chấp nhận `data.teacherId` tường minh (fallback `getUid()`) → admin gán học sinh/lớp cho giáo viên khác.
- Invite giáo viên qua Supabase Dashboard; DB trigger tự tạo row `teachers` — không dùng Edge Function.
- Optimistic UI + retry (không offline-first thật).

## Model học sinh (migration 20260603000002)
- **`students.email`** (text, nullable): thêm vào bảng `students`. `studentService.fromDB/toDB` map thêm `email`. `StudentModal` có input email (optional, prop `requireClass={false}` cho phép tạo học sinh không lớp).
- `enrollmentService.getAllForTeacher()`: đọc tất cả enrollment của teacher (dùng trong StudentsDirectoryPage để gộp map `studentId → [enrollments]`).
- `src/components/students/ImportStudentsModal.jsx`: modal import hàng loạt từ Excel (.xlsx), map header linh hoạt, preview + validation, tạo qua `studentService`.

## Model đánh giá kỹ năng (migration 20260603000001 + 20260607000001)
- **`classes.skill_config`** (jsonb): mảng `[{ name, order }]` định nghĩa kỹ năng của lớp — **KHÔNG còn `maxScore`** (bỏ ở app layer từ change `improve-review-fee-ux`). Default IELTS 4 kỹ năng. Giá trị `maxScore` orphan trong DB cũ bị bỏ qua khi đọc.
- **`reviews.scores`** (jsonb): keyed theo tên kỹ năng `{ "Listening": 7.5, "Reading": 6.0 }`. Không còn 4 cột cố định.
- **`reviews.score_max`** (jsonb, migration 20260607000001): snapshot thang điểm tối đa từ mock test gần nhất tại thời điểm tạo đánh giá `{ "Listening": 9, "Reading": 9 }`. Phiếu cũ mặc định `{}` → fallback `9`.
- **`DEFAULT_SKILL_CONFIG`** export từ `classService.js` — dùng làm fallback ở service + UI, chỉ gồm `{ name, order }`.
- `ClassModal`: tái dùng `MockTestSectionBuilder` với `showMaxScore={false}` (ẩn ô điểm tối đa); `toSkillConfig` chỉ lưu `{ name, order }`.
- `MockTestSectionBuilder`: nhận prop `showMaxScore = true`; ẩn ô điểm tối đa khi `false`. Dùng chung bởi `ClassModal` và `MockTestModal`.
- `MockTestModal`: khi init sections từ `skillConfig` (không còn maxScore) → gán `maxScore` mặc định `9`.
- `ReviewForm`: render ô nhập điểm động theo `skillConfig` của lớp. `maxScore` mỗi kỹ năng theo ưu tiên: edit→`editingReview.scoreMax[name]`, create→`latestMockEntry.mockTest.sections`, fallback `9`. Khi tạo mới, lưu `scoreMax` snapshot vào data `onSave`. **Chặn tạo đánh giá khi học sinh chưa có mock test** (ẩn nút "Thêm đánh giá" + helper text).
- `RadarChartPanel`: chuẩn hóa điểm về % dùng `review.scoreMax[skill.name] ?? 9`, trục `r` cố định 0–100.
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

## Model settings
- `settingsService` chỉ map `centerName`, `defaultFeePerSession`, `currency` (đã **bỏ `teacherName`/`teacher_name`** ở service layer — cột DB còn nhưng orphan, không migration drop).
- **Tên hiển thị giáo viên lưu duy nhất tại `teachers.name`**, đọc qua `useAuth().teacher.name`, ghi qua `useAuth().updateTeacherName(name)` (refresh `teacher` state tại chỗ). Không lưu tên ở bảng `settings`.

---
