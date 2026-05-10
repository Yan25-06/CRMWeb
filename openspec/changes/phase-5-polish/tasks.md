# Tasks: Phase 5 — Polish & Deploy

## 1. Dashboard Charts
- [ ] 1.1 Cài chart.js + react-chartjs-2 (đã có trong package.json)
- [ ] 1.2 Bar chart: doanh thu 12 tháng (navy-600 bars)
- [ ] 1.3 Donut chart: học sinh phân bổ theo lớp
- [ ] 1.4 Chart responsive + Navy theme colors
- [ ] 1.5 Thêm vào DashboardPage bên dưới stats grid

## 2. PWA
- [ ] 2.1 Cài vite-plugin-pwa
- [ ] 2.2 Config workbox (cache-first strategy)
- [ ] 2.3 Icons 192×192 và 512×512 (Navy bg + chữ P trắng)
- [ ] 2.4 Test "Add to Home Screen" trên mobile

## 3. Mobile Polish
- [ ] 3.1 Kiểm tra tất cả pages trên mobile 375px
- [ ] 3.2 Bottom sheet modal cho mobile (thay modal center)
- [ ] 3.3 Swipe-to-delete trên student list
- [ ] 3.4 Touch target minimum 44×44px cho tất cả buttons

## 4. Performance
- [ ] 4.1 Lazy load pages với React.lazy + Suspense
- [ ] 4.2 useMemo cho các computed values nặng
- [ ] 4.3 debounce search inputs
- [ ] 4.4 Check bundle size (target < 300KB gzip)

## 5. Deploy
- [ ] 5.1 Tạo vercel.json (SPA fallback)
- [ ] 5.2 Hoặc netlify.toml với redirect rule
- [ ] 5.3 npm run build → kiểm tra dist/
- [ ] 5.4 Deploy + test production build
- [ ] 5.5 Cập nhật README với live URL

## 6. Final QA
- [ ] 6.1 Test toàn bộ user flow từ đầu (seed → điểm danh → học phí → xuất phiếu)
- [ ] 6.2 Test export/import backup
- [ ] 6.3 Test trên Chrome mobile (Android)
- [ ] 6.4 Test trên Safari mobile (iOS)
- [ ] 6.5 Lighthouse score: Performance ≥ 90, Accessibility ≥ 85
