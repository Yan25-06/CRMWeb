# CLAUDE.md

Hướng dẫn cho AI khi làm việc trong repo này. **Đọc file này đầu mỗi session thay vì quét lại toàn bộ project.**

> ⚠️ **QUY TẮC BẮT BUỘC:** Sau khi sửa/thêm tính năng làm thay đổi kiến trúc, data model, service layer, routing, scripts hoặc trạng thái migration — **cập nhật lại file này và file README.md** ở phần liên quan. Giữ nó luôn khớp với code. Đừng để nó lỗi thời 
---

## Dự án là gì
Web app quản lý điểm danh + học phí cho giáo viên/trung tâm tiếng Anh nhỏ tại Việt Nam (IELTS/TOEIC/Giao tiếp). UI Navy Blue + White, toàn bộ tiếng Việt. Tên package: `rollcall-manager`. Tên hiển thị: "Anh Ngữ Ms.Phương".

## Stack
- **React 18 + Vite** (alias `@/` → `src/`, cấu hình trong `vite.config.js`)
- **Tailwind CSS 3** với custom Navy design tokens (`tailwind.config.js`, `src/index.css`)
- **Supabase** (`@supabase/supabase-js`) — auth + Postgres backend, đang dần thay localStorage
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

## ⭐ Điểm quan trọng nhất: Migration localStorage → Supabase đang DỞ DANG

Project đang chuyển từ store localStorage sang Supabase service layer. **Tồn tại song song 2 nguồn data** — phải biết file mình sửa đang dùng cái nào:

### Nguồn data cũ — `src/store/db.js` (localStorage)
- File lớn (~1100 dòng), toàn bộ CRUD trên localStorage với key prefix `phf_`.
- Cũng chứa `seedDemoData()` (gọi trong `App.jsx`) và export/import backup JSON.
- **Shape các entity được ghi chú dạng comment ngay trên mỗi nhóm hàm** — đọc đó để biết cấu trúc dữ liệu.

### Nguồn data mới — `src/services/*.js` (Supabase)
Mỗi service là một object với method `getAll / getById / create / update / remove` (+ method riêng theo domain). Pattern chuẩn (xem `studentService.js`, `classService.js`):
- `fromDB(row)` map snake_case → camelCase; `toDB(data)` map camelCase → snake_case.
- Mọi method `throw new Error(error.message)` khi Supabase lỗi.
- `create` gắn `teacher_id` qua `getUid()` (export từ `studentService.js`).
- **UI không gọi `supabase.*` trực tiếp** — luôn qua service (trừ auth trong `useAuth.jsx`).

Services đã có: `studentService`, `classService` (+`teacherService`), `enrollmentService`, `sessionService`, `attendanceService`, `homeworkService`, `hwAssignmentService`, `submissionService`, `scheduleService`, `feeService`, `paymentService`, `reviewService`, `sessionReviewService`, `generalCommentService`.

### Trạng thái migration theo trang (cập nhật khi chuyển tiếp!)
- ✅ **Đã dùng services:** `ClassesOverviewPage`, `ClassDetailPage/index` + tabs `StudentsTab`, `AttendanceTab`, `HomeworkTab`, `SchedulePage`, `DashboardPage` (một phần), `FeesPage` + components fees (`FeesTable`, `PaymentModal`, `StudentPaymentHistoryPanel`), `ReviewsPage` + components reviews (`ClassOverviewTable`, `GeneralCommentPanel`), `StudentDetailPanel` (phần session reviews).
- ⏳ **Còn dùng `store/db.js`:** `ReportsPage`, `SettingsPage`, `MockTestTab`, `DashboardPage` (một phần); `ReviewsPage`/`StudentDetailPanel` còn dùng db.js cho attendance/homework/mock-test (chưa phải scope này).
- Service layer còn thiếu (theo roadmap): mock_tests/mock_test_results/settings.
- Change cutover cuối cùng sẽ **xóa `src/store/db.js`**. Không migrate data localStorage cũ — bắt đầu sạch.

**Khi thêm tính năng mới:** ưu tiên viết qua Supabase service. Nếu service chưa tồn tại cho domain đó, tạo mới theo đúng pattern `fromDB/toDB` thay vì thêm vào `db.js`.

---

## Auth
- `src/hooks/useAuth.jsx` — `AuthProvider` + `useAuth()`. Cung cấp `user`, `teacher` (profile từ bảng `teachers`), `loading`, `needsPassword`, `login`, `logout`, `completePasswordSetup`.
- **Lưu ý deadlock:** không `await` supabase trong callback `onAuthStateChange` (auth lock). Profile teacher nạp ở `useEffect` riêng theo `user.id`.
- Flow invite/recovery: cờ bắt từ URL hash ngay khi module load (trước khi Supabase xóa hash) → `SetPasswordPage`.
- `src/main.jsx` → `AuthGate`: loading spinner → SetPassword (nếu invite) → `LoginPage` (nếu chưa đăng nhập) → `App`.

## Routing & Layout
- **Không dùng react-router.** Routing là state `page` trong `App.jsx` (`useState` + `switch` trong `renderPage()`).
- Trang: `dashboard`, `fees`, `reports`, `reviews`, `schedule`, `classes`, `settings`.
- `classes` có 2 chế độ: list (`ClassesOverviewPage`) ↔ detail (`ClassDetailPage`) qua `selectedClassId` (persist trong localStorage).
- `ClassDetailPage` có các tab: Students, Attendance, Homework, MockTest.
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
│   └── ClassDetailPage/ (index.jsx + tabs/)
├── services/   ← Supabase service layer (data MỚI)
├── store/      ← db.js (localStorage, data CŨ) + mockTestExport.js
├── hooks/useAuth.jsx
├── lib/supabase.js
├── utils/      ← helpers, useDebounce, scheduleConflict
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
- Đọc/ghi data qua service (mới) hoặc `db.js` (cũ) — **không gọi localStorage/supabase trực tiếp trong component.**
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
- Change đang mở (chưa archive): `add-supabase-multi-teacher` (reference gốc), `add-service-tests-settings`, `add-admin-panel`.
- Đã archive: `add-service-fees` (2026-06-02), `add-service-reviews` (2026-06-02).
- Một change gồm `proposal.md`, `design.md`, `specs/`, `tasks.md`. Implement theo tasks, check `[x]` khi xong, không làm ngoài scope.

## Quyết định kiến trúc đã chốt (từ ROADMAP)
- RLS enforce ở PostgreSQL, **không** filter quyền ở frontend.
- Admin read-only = không cấp policy ghi cho admin ở DB.
- Invite giáo viên qua Supabase Dashboard; DB trigger tự tạo row `teachers` — không dùng Edge Function.
- Optimistic UI + retry (không offline-first thật).

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
