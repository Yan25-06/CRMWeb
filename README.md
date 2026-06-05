# Phiếu Học Phí — Navy Edition

Hệ thống quản lý điểm danh, học phí và nhận xét học sinh cho giáo viên/trung tâm tiếng Anh nhỏ tại Việt Nam.

## Tech Stack

- **React 18 + Vite** — frontend framework (alias `@/` → `src/`)
- **Tailwind CSS 3** — utility-first styling với custom Navy design tokens
- **Supabase** — auth + Postgres backend (nguồn dữ liệu duy nhất; RLS phủ toàn bộ bảng)
- **Chart.js / react-chartjs-2** — biểu đồ dashboard
- **html2canvas + jsPDF** — xuất phiếu học phí PDF
- **xlsx** — xuất Excel
- **lucide-react** — icons

## Biến môi trường

Copy `.env.example` → `.env` rồi điền:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Triển khai production

Trước khi giao cho người dùng thật, làm theo **[DEPLOYMENT.md](DEPLOYMENT.md)** — runbook các bước cấu hình Supabase thủ công (bootstrap admin, Auth URL, tắt tự đăng ký, backup) và kiểm thử phân quyền.

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
│   ├── AdminPanelPage.jsx    # Admin Panel (stat cards + tạo/giao lớp)
│   ├── StudentsDirectoryPage.jsx # Danh bạ học viên tổng
│   ├── LoginPage.jsx         # Đăng nhập + quên mật khẩu
│   └── SetPasswordPage.jsx   # Đặt mật khẩu (flow invite/recovery)
├── services/                 # Supabase service layer (toàn bộ data, mỗi domain 1 service)
├── hooks/                    # useAuth.jsx, usePermissions.js, useOnlineStatus.js
├── lib/supabase.js           # Supabase client
├── utils/                    # helpers, useDebounce, scheduleConflict, retryQueue, mockTestExport
├── components/ErrorBoundary.jsx # Bắt lỗi render toàn cục → màn hình khôi phục
├── App.jsx                   # Layout + routing (state-based, không dùng react-router)
├── main.jsx                  # Entry point + ErrorBoundary + AuthGate
└── index.css                 # Tailwind + design system classes
```

## Routing

Không dùng react-router. Routing là state `page` trong `App.jsx`:
`dashboard` | `classes` | `fees` (chỉ admin) | `reports` | `reviews` | `schedule` | `settings` | `admin` (chỉ admin) | `students`

## Trạng thái dữ liệu

Migration localStorage → Supabase **đã hoàn tất**. Toàn bộ data đi qua service layer (`src/services/*`), RLS phủ toàn bộ bảng. Xem `openspec/ROADMAP.md` cho lịch sử và `CLAUDE.md` cho chi tiết kiến trúc hiện hành.

## Design Tokens (Navy/White)

| Token    | Hex      | Dùng cho               |
|----------|----------|------------------------|
| navy-950 | #06142B  | Backgrounds tối        |
| navy-900 | #0F2044  | Sidebar, header        |
| navy-800 | #1B3A6B  | Primary buttons        |
| navy-600 | #2E5FA3  | Accents, links         |
| navy-50  | #E8EEF7  | Hover states           |
