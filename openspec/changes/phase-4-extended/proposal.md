# Proposal: Phase 4 — Nhận Xét, Lịch Dạy, Chấm Công

## Status: 🔲 TODO

## Intent
Bổ sung các tính năng phụ trợ:
1. Nhận xét học sinh từng buổi (điểm nói, điểm viết, nhận xét)
2. Lịch dạy theo tuần/tháng
3. Chấm công giáo viên (optional)

## Scope
- ReviewsPage: nhập điểm + nhận xét, xem lịch sử theo HS
- SchedulePage: calendar view ngày/tuần/tháng, CRUD lịch dạy
- Export nhận xét ra Excel (dùng SheetJS)

## Approach
- ReviewsPage: select lớp + ngày → grid HS → nhập điểm/nhận xét inline
- SchedulePage: calendar component tự build (không dùng lib ngoài)
- Excel export: SheetJS (đã có trong Vite bundle)
