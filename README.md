# Phiếu Học Phí — Navy Edition

Hệ thống quản lý điểm danh, học phí và nhận xét học sinh cho giáo viên/trung tâm tiếng Anh nhỏ tại Việt Nam.

## Tech Stack

- **React 18 + Vite** — frontend framework (alias `@/` → `src/`)
- **Tailwind CSS 3** — utility-first styling với custom Navy design tokens
- **Supabase** — auth + Postgres backend (đang thay thế localStorage)
- **localStorage** — một phần dữ liệu vẫn dùng trong quá trình migration
- **Chart.js / react-chartjs-2** — biểu đồ dashboard
- **html2canvas + jsPDF** — xuất phiếu học phí PDF
- **xlsx** — xuất Excel
- **lucide-react** — icons

## Biến môi trường

Tạo file `.env` với:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Cài đặt & Chạy

```bash
npm install
npm run dev
# Mở http://localhost:5173
```

## Build & Deploy

```bash
npm run build
# Output: docs/ (không phải dist/)
# Deploy lên GitHub Pages tại /RollCallWeb/
```

## Cấu trúc dự án

```
src/
├── components/
│   ├── ui/index.jsx          # Button, Card, Input, Modal, Badge, Toast...
│   ├── layout/Navbar.jsx     # Sidebar + mobile nav
│   ├── attendance/           # AttendanceToggle, StudentAttendancePanel, RingChart
│   ├── classes/              # ClassCard, ClassModal, SessionModal, SessionSelector
│   ├── fees/                 # FeesTable, PaymentModal, StudentPaymentHistoryPanel
│   ├── homework/             # HomeworkAssignmentModal, SubmissionTable, ...
│   ├── mock-test/            # MockTestModal, ScoreTable, SectionBuilder, ...
│   ├── reviews/              # ReviewForm, RadarChartPanel, ReportCardModal, ...
│   ├── schedule/             # WeeklyGrid, DailyAgenda, ScheduleCard, ScheduleModal
│   ├── reports/              # ExportExcelButton, ExportPdfButton, ReportCard
│   └── students/             # StudentModal, StudentSidebar, EnrollmentModal, ...
├── pages/
│   ├── DashboardPage.jsx     # Stats tổng quan + doanh thu tháng/năm
│   ├── ClassesOverviewPage.jsx # Danh sách lớp
│   ├── ClassDetailPage/      # index.jsx + tabs: Students, Attendance, Homework, MockTest
│   ├── FeesPage.jsx          # Quản lý học phí + thanh toán
│   ├── ReviewsPage.jsx       # Nhận xét học sinh
│   ├── SchedulePage.jsx      # Lịch dạy (weekly grid + daily agenda)
│   ├── ReportsPage.jsx       # Xuất báo cáo
│   ├── SettingsPage.jsx      # Cài đặt trung tâm
│   ├── LoginPage.jsx         # Đăng nhập Supabase
│   └── SetPasswordPage.jsx   # Đặt mật khẩu (flow invite/recovery)
├── services/                 # Supabase service layer (nguồn data mới)
│   ├── studentService.js
│   ├── classService.js
│   ├── enrollmentService.js
│   ├── sessionService.js
│   ├── attendanceService.js
│   ├── homeworkService.js
│   ├── hwAssignmentService.js
│   ├── submissionService.js
│   └── scheduleService.js
├── store/
│   └── db.js                 # localStorage helpers (đang dần được thay bởi services/)
├── hooks/useAuth.jsx         # AuthProvider + useAuth()
├── lib/supabase.js           # Supabase client
├── utils/                    # helpers.js, useDebounce.js, scheduleConflict.js
├── App.jsx                   # Layout + routing (state-based, không dùng react-router)
├── main.jsx                  # Entry point + AuthGate
└── index.css                 # Tailwind + design system classes
```

## Routing

Không dùng react-router. Routing là state `page` trong `App.jsx`:
`dashboard` | `classes` | `fees` | `reports` | `reviews` | `schedule` | `settings`

## Roadmap Migration Supabase

Xem `openspec/ROADMAP.md` — đang chuyển toàn bộ data từ localStorage sang Supabase:
- ✅ Schema, Auth, RLS, service layer: students/classes/enrollments/sessions/attendance/homework/schedule
- ⏳ Còn lại: fees/payments, reviews, mock tests, settings → xóa `db.js`

## Design Tokens (Navy/White)

| Token    | Hex      | Dùng cho               |
|----------|----------|------------------------|
| navy-950 | #06142B  | Backgrounds tối        |
| navy-900 | #0F2044  | Sidebar, header        |
| navy-800 | #1B3A6B  | Primary buttons        |
| navy-600 | #2E5FA3  | Accents, links         |
| navy-50  | #E8EEF7  | Hover states           |
