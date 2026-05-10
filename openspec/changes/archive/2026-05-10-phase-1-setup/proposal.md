# Proposal: Phase 1 — Setup & Design System

## Status: ✅ COMPLETE

## Intent
Xây dựng nền tảng kỹ thuật cho toàn bộ dự án:
- Cấu hình Vite + React + Tailwind
- Design system Navy/White hoàn chỉnh
- Component library tái sử dụng
- Data layer localStorage
- Layout chính (Navbar + App shell)

## Scope
- Vite scaffold với aliases
- Tailwind config với Navy color tokens
- CSS design system (buttons, cards, inputs, modals, toasts...)
- Components: Button, Card, Input, Select, Modal, StatCard, Badge, Toast, Skeleton, Empty
- Navbar: desktop sidebar + mobile bottom nav + mobile drawer
- App.jsx: routing đơn giản, month/year picker
- Store: db.js với đầy đủ CRUD helpers
- Dashboard page (hoàn chỉnh)
- Settings page (hoàn chỉnh)
- Placeholder pages cho Phase 2-4

## Approach
- Không dùng router library (state-based navigation)
- localStorage cho tất cả persistence
- Tailwind utility classes + custom component classes trong index.css
- Seed demo data tự động khi lần đầu mở app

## Deliverables
- [x] package.json, vite.config.js, tailwind.config.js, postcss.config.js
- [x] index.html với Google Fonts
- [x] src/index.css — design system
- [x] src/store/db.js — data layer
- [x] src/components/ui/index.jsx — component library
- [x] src/components/Navbar.jsx
- [x] src/pages/DashboardPage.jsx
- [x] src/pages/SettingsPage.jsx
- [x] src/pages/PlaceholderPages.jsx
- [x] src/App.jsx
- [x] public/manifest.json (PWA)
