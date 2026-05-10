# AGENTS.md — Hướng dẫn cho AI Coding Assistants

## Dự án là gì?
Web app quản lý điểm danh và học phí cho giáo viên/trung tâm nhỏ tại Việt Nam.
Giao diện Navy Blue + White, tiếng Việt.

## Stack
- React 18 + Vite (alias `@/` → `src/`)
- Tailwind CSS 3 với custom Navy tokens
- localStorage (không có backend)
- lucide-react cho icons
- clsx cho conditional classes

## Quy tắc bắt buộc

### Code style
- Dùng functional components + hooks (không class components)
- Không dùng `any` type (nếu có TypeScript sau này)
- Import từ `@/` không dùng relative paths dài
- Dùng `clsx()` cho conditional classes, không template literals

### Design system
- KHÔNG hard-code màu hex trong component. Dùng Tailwind classes:
  - Primary: `bg-navy-800`, `text-navy-800`, v.v.
  - Text mặc định: `text-navy-900`
  - Background card: `bg-white` hoặc class `.card`
- Dùng các component từ `@/components/ui`:
  - `Button`, `Card`, `Input`, `Select`, `Modal`, `Badge`, `StatCard`, `Empty`
  - Không tự tạo button/input mới trừ khi thật sự cần

### Data
- Tất cả data đọc/ghi qua `@/store/db.js`
- Không gọi localStorage trực tiếp trong components
- Format tiền tệ: `new Intl.NumberFormat('vi-VN').format(n) + 'đ'`
- Format ngày: `new Date(date).toLocaleDateString('vi-VN')`

### UX
- Luôn có toast feedback sau mỗi action (success/error)
- Luôn có loading state cho async operations
- Luôn có empty state khi list rỗng (dùng component `<Empty />`)
- Confirm dialog trước khi xóa dữ liệu

## Cấu trúc thư mục hiện tại
```
src/
├── components/
│   ├── ui/index.jsx     ← component library (Button, Card, Input, Modal...)
│   └── Navbar.jsx       ← layout navigation
├── pages/
│   ├── DashboardPage.jsx   ← ✅ DONE
│   ├── SettingsPage.jsx    ← ✅ DONE
│   ├── PlaceholderPages.jsx← stub cho Phase 2-4
│   ├── StudentsPage.jsx    ← Phase 2
│   ├── AttendancePage.jsx  ← Phase 3
│   ├── FeesPage.jsx        ← Phase 3
│   ├── ReviewsPage.jsx     ← Phase 4
│   └── SchedulePage.jsx    ← Phase 4
├── store/
│   └── db.js            ← ✅ DONE - tất cả localStorage helpers
├── App.jsx              ← ✅ DONE - routing + layout
├── main.jsx             ← entry point
└── index.css            ← design system classes
```

## Workflow với OpenSpec
1. Đọc `openspec/changes/<phase>/proposal.md` để hiểu mục tiêu
2. Đọc `openspec/changes/<phase>/specs/` để biết requirements
3. Implement từng task trong `openspec/changes/<phase>/tasks.md`
4. Check off [x] sau khi xong từng task
5. Không làm gì ngoài scope của phase hiện tại

## Phase hiện tại: Phase 2 (Quản Lý Học Sinh)
Xem: `openspec/changes/phase-2-students/`
