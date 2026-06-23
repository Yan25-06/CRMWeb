# Anh Ngữ Ms.Phương — Classroom Management App

A production web app for managing attendance, tuition fees, homework, mock tests, and student progress reports at a small English language center in Vietnam. Built and deployed solo; currently used by real teachers.

**Live:** https://msphuongenglishcrm.studio/

---

## Try it out

**Demo account:**
```
Email:    demo@gmail.com
Password: 123456
```

---

## What it does

- **Attendance** — track per-session attendance across multiple classes
- **Tuition fees** — monthly or course-based billing, payment tracking, surcharge handling
- **Homework** — assign and track submission status per session
- **Mock tests** — record IELTS/TOEIC scores by skill, visualize progress over time
- **Student reviews** — skill radar charts, PDF report cards, bulk export as ZIP
- **Schedule** — weekly grid + daily agenda view, with admin teacher attendance check-in (present/absent/makeup) per slot
- **Lịch dạy tự động** — đặt lịch học của lớp (chọn thứ + giờ) → các ca tự xuất hiện và đồng bộ trên trang Lịch Dạy
- **Chấm công giáo viên hiển thị trực quan** — trạng thái chấm công ngay trên thẻ lịch tuần (viền màu + chip trạng thái)
- **Reports** — attendance, fees, homework, and mock test charts with Excel/PDF export
- **Lương giáo viên & dạy thay** — Admin đặt lương tháng cho giáo viên trong Admin Panel. Tại tab "Lịch Dạy", khi chấm vắng có thể chọn người dạy thay. Tab "Bảng Lương" tính toán và hiển thị lương thực nhận theo tháng (admin xem tất cả; giáo viên xem của mình); hỗ trợ export Excel.
- **Multi-teacher + admin** — teachers see only their own data; admin manages all classes and teachers

---

## Technical highlights

**Service layer architecture** — no component talks to Supabase directly. All data flows through `src/services/*.js`, each with `fromDB`/`toDB` mappers (snake_case ↔ camelCase) and typed error handling. Adding a new domain means adding one service file; the UI layer never changes its import pattern.

**Client-side routing without a library** — navigation is a `page` state variable in `App.jsx`, synced to browser history via the History API (`pushState`/`replaceState`/`popstate`). Back/Forward work naturally, no URL changes, no extra dependency.

**Row-Level Security at the database** — Supabase RLS policies enforce per-teacher isolation at the Postgres level. The frontend permission layer (`usePermissions` hook) is UI-only; it gates what buttons are visible, not what data is accessible.

**Offline retry queue** — write operations that fail due to a dropped connection are queued in memory and replayed automatically when the browser comes back online (`src/utils/retryQueue.js`).

**Lazy-loaded heavy dependencies** — `xlsx`, `jsPDF`, `html2canvas`, and `jszip` are loaded via dynamic `import()` only when the user triggers an export, keeping the initial bundle small.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 (custom Navy design tokens) |
| Backend | Supabase (Postgres + Auth + RLS) |
| Charts | Chart.js + react-chartjs-2 |
| Export | html2canvas, jsPDF, xlsx, jszip |
| Icons | lucide-react |
| Deploy | Static build (output → `dist/`) |

---

## Project structure

```
src/
├── services/       # Supabase service layer — one file per domain
├── hooks/          # useAuth, usePermissions, useOnlineStatus
├── components/
│   ├── ui/         # Shared design system: Button, Modal, Toast, Badge...
│   ├── attendance/ classes/ fees/ homework/ mock-test/ reviews/ schedule/ students/ reports/
├── pages/          # One file per route
├── utils/          # retryQueue, mockTestExport, scheduleConflict, useDebounce
└── App.jsx         # State-based router + History API sync
```

---

## Running locally

```bash
# requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
npm install
npm run dev
```

```bash
npm run build   # outputs to dist/
```
