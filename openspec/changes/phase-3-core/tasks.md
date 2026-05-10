# Tasks: Phase 3 — Điểm Danh & Học Phí

## 1. AttendancePage — Chấm Điểm Danh
- [ ] 1.1 Tạo `src/pages/AttendancePage.jsx`
- [ ] 1.2 Sub-tab switcher: "Chấm" / "Xem"
- [ ] 1.3 Filter bar: Class select + Date input
- [ ] 1.4 Student grid: avatar chữ cái + tên + toggle button
- [ ] 1.5 Toggle state: local Map<studentId, boolean>
- [ ] 1.6 Prefill từ db khi chọn ngày có data cũ
- [ ] 1.7 Counter bar "X/Y đã chấm"
- [ ] 1.8 Nút "Lưu Điểm Danh" → upsertAttendance()
- [ ] 1.9 Toast success với ngày

## 2. AttendancePage — Xem Điểm Danh
- [ ] 2.1 Lấy danh sách ngày unique trong tháng có attendance
- [ ] 2.2 Build matrix: students × dates
- [ ] 2.3 Render bảng scroll ngang
- [ ] 2.4 Cell component: ✓ / ✗ / — với màu tương ứng
- [ ] 2.5 Cột tổng buổi cuối cùng
- [ ] 2.6 Class filter dropdown

## 3. FeesPage
- [ ] 3.1 Tạo `src/pages/FeesPage.jsx`
- [ ] 3.2 Build fee rows: lấy students, tính sessions + total
- [ ] 3.3 Table với đầy đủ columns
- [ ] 3.4 Badge trạng thái paid/unpaid
- [ ] 3.5 Nút toggle "Đã thu" / "Chưa thu"
- [ ] 3.6 Inline edit phụ phí
- [ ] 3.7 Summary row tổng doanh thu
- [ ] 3.8 Modal xuất phiếu (FeeReceiptModal)

## 4. FeeReceiptModal component
- [ ] 4.1 Tạo `src/components/FeeReceiptModal.jsx`
- [ ] 4.2 Layout phiếu theo spec (navy header + white body)
- [ ] 4.3 Dữ liệu: tên HS, lớp, tháng, ngày học, buổi, đơn giá, phụ phí, tổng
- [ ] 4.4 html2canvas capture div#fee-receipt
- [ ] 4.5 Download PNG với tên file `phieu_[ten-hs]_thang[X]-[Y].png`
- [ ] 4.6 Loading state khi đang export

## 5. Kết nối App.jsx
- [ ] 5.1 Import AttendancePage thay placeholder
- [ ] 5.2 Import FeesPage thay placeholder
- [ ] 5.3 Truyền đúng year, month props
