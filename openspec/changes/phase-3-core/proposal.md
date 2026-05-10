# Proposal: Phase 3 — Điểm Danh & Học Phí

## Status: 🔲 TODO

## Intent
Đây là core value của app. Cho phép:
1. Điểm danh học sinh từng buổi
2. Xem tổng hợp điểm danh theo tháng
3. Tính và xem học phí tự động
4. Xuất phiếu học phí (html2canvas → PNG/PDF)

## Scope
- AttendancePage: chọn lớp/ngày → chấm từng HS → submit
- ViewAttendancePage: bảng tổng hợp tháng theo HS
- FeesPage: bảng học phí tháng, mark paid/unpaid, xuất phiếu

## Key UX decisions
- Điểm danh: grid học sinh với toggle Có/Vắng (không dùng checkbox)
- Học phí: tự động tính từ số buổi có mặt × đơn giá
- Xuất phiếu: dùng html2canvas chụp div → download PNG

## Approach
- AttendancePage có 2 sub-views: "Chấm điểm danh" và "Xem điểm danh"
- Chấm điểm danh: select lớp + date picker → hiện grid HS
- Upsert attendance records khi submit
