# Proposal: Phase 5 — Polish & Deploy

## Status: 🔲 TODO

## Intent
Hoàn thiện app trước khi deploy:
- Dashboard charts (Chart.js)
- PWA hoàn chỉnh (service worker)
- Responsive polish
- Deploy lên Vercel/Netlify

## Scope
- Thêm Chart.js vào Dashboard (bar chart doanh thu theo tháng, donut học sinh theo lớp)
- PWA: service worker + offline support
- Mobile UX polish: swipe gestures, bottom sheet modals
- Performance: lazy load các pages
- Deploy config

## Approach
- Chart.js với react-chartjs-2
- Vite PWA plugin cho service worker
- Code splitting tự động qua Vite
