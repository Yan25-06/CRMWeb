# Tasks: Phase 1 — Setup & Design System

## 1. Project Config
- [x] 1.1 package.json với đầy đủ dependencies
- [x] 1.2 vite.config.js với alias `@/`
- [x] 1.3 tailwind.config.js với Navy color tokens + animations
- [x] 1.4 postcss.config.js
- [x] 1.5 index.html với Google Fonts (DM Sans, Instrument Serif, JetBrains Mono)

## 2. Design System (index.css)
- [x] 2.1 CSS variables cho Navy palette
- [x] 2.2 Component classes: .btn, .btn-primary, .btn-secondary, .btn-ghost, .btn-danger
- [x] 2.3 Component classes: .card, .card-flat, .card-navy
- [x] 2.4 Component classes: .input, .select
- [x] 2.5 Component classes: .badge và variants
- [x] 2.6 Component classes: .table-base (thead/tbody styling)
- [x] 2.7 Component classes: .stat-card, .stat-value, .stat-label
- [x] 2.8 Component classes: .nav-tab
- [x] 2.9 Component classes: .toast và variants
- [x] 2.10 Component classes: .modal-overlay, .modal-box, .modal-header/body/footer
- [x] 2.11 Component classes: .skeleton, .att-dot (present/absent/empty)
- [x] 2.12 Utilities: .glass-navy, .bg-dots, .bg-stripe, .scrollbar-hide
- [x] 2.13 Custom scrollbar Navy theme
- [x] 2.14 Keyframes: fadeIn, slideUp, slideDown, pulseSoft, shimmer

## 3. Component Library (src/components/ui/index.jsx)
- [x] 3.1 Button (variants + sizes)
- [x] 3.2 Badge (5 variants)
- [x] 3.3 Card + Card.Navy
- [x] 3.4 Input (với label + error)
- [x] 3.5 Select (với custom arrow)
- [x] 3.6 Modal (overlay + box + header/body/footer)
- [x] 3.7 StatCard (label + value + sub + icon + accent color)
- [x] 3.8 Toast system (global singleton via setToastState)
- [x] 3.9 ToastContainer
- [x] 3.10 Skeleton
- [x] 3.11 Empty state

## 4. Data Layer (src/store/db.js)
- [x] 4.1 Generic get/set helpers + uid()
- [x] 4.2 Students CRUD (get, save, add, update, delete)
- [x] 4.3 Classes CRUD
- [x] 4.4 Attendance (get, upsert, byDate, byMonth, byStudent)
- [x] 4.5 Fees (get, upsert, getFeeByStudentMonth, calcFee)
- [x] 4.6 Schedule CRUD
- [x] 4.7 Reviews (get, upsert)
- [x] 4.8 Settings (get, save với merge)
- [x] 4.9 getDashboardStats()
- [x] 4.10 exportData() → JSON download
- [x] 4.11 importData(jsonString)
- [x] 4.12 seedDemoData()

## 5. Navbar (src/components/Navbar.jsx)
- [x] 5.1 Desktop sidebar: logo + nav items + bottom actions
- [x] 5.2 Nav items: Dashboard, Điểm Danh, Học Phí, Nhận Xét, Lịch Dạy, Học Sinh
- [x] 5.3 Bottom actions: Xuất Backup, Cài Đặt
- [x] 5.4 Mobile top bar
- [x] 5.5 Mobile drawer menu (overlay + slide-in)
- [x] 5.6 Mobile bottom nav (5 items)

## 6. Pages
- [x] 6.1 DashboardPage: stats grid + student list + class list + quick actions
- [x] 6.2 SettingsPage: general info + data management + danger zone
- [x] 6.3 PlaceholderPages: Attendance, Fees, Reviews, Schedule, Students

## 7. App Shell (src/App.jsx)
- [x] 7.1 State-based routing (useState page)
- [x] 7.2 Month/year picker trong top bar
- [x] 7.3 Auto seed demo data on mount
- [x] 7.4 ToastContainer global
