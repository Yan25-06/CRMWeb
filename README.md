# Phiếu Học Phí — Navy Edition

Hệ thống điểm danh và quản lý học phí cho giáo viên/trung tâm nhỏ.

## Tech Stack
- **React 18 + Vite** — frontend framework
- **Tailwind CSS** — utility-first styling
- **localStorage** — lưu trữ cục bộ, không cần server
- **Chart.js** — biểu đồ dashboard
- **html2canvas** — xuất phiếu học phí

## Cài đặt & Chạy

```bash
cd phieuhocphi
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

## Build & Deploy

```bash
npm run build
# Folder dist/ → upload lên Vercel hoặc Netlify
```

## Cấu trúc dự án

```
src/
├── components/
│   ├── ui/         # Button, Card, Input, Modal, Toast...
│   └── Navbar.jsx  # Sidebar + mobile nav
├── pages/
│   ├── DashboardPage.jsx
│   ├── AttendancePage.jsx   (Phase 3)
│   ├── FeesPage.jsx         (Phase 3)
│   ├── ReviewsPage.jsx      (Phase 4)
│   ├── SchedulePage.jsx     (Phase 4)
│   ├── StudentsPage.jsx     (Phase 2)
│   └── SettingsPage.jsx
├── store/
│   └── db.js       # Tất cả localStorage helpers
├── App.jsx         # Layout + routing
├── main.jsx
└── index.css       # Tailwind + design system
```

## Roadmap

- [x] **Phase 1** — Setup, design system, layout, data layer ✅
- [ ] **Phase 2** — Quản lý học sinh + lớp (CRUD)
- [ ] **Phase 3** — Điểm danh + Học phí
- [ ] **Phase 4** — Nhận xét + Lịch dạy + Chấm công
- [ ] **Phase 5** — Polish, PWA, deploy

## Design Tokens (Navy/White)

| Token | Hex | Dùng cho |
|-------|-----|---------|
| navy-950 | #06142B | Backgrounds tối |
| navy-900 | #0F2044 | Sidebar, header |
| navy-800 | #1B3A6B | Primary buttons |
| navy-600 | #2E5FA3 | Accents, links |
| navy-50  | #E8EEF7 | Hover states |
| white    | #FFFFFF | Card surfaces |
