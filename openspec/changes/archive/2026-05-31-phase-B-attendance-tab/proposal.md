# Proposal: Phase B — Tab Điểm Danh

## Status: 🔲 TODO (sau Phase A)

## Intent
Xây dựng tab "Điểm Danh": GV chấm có/vắng per buổi học.
Buổi học (Session) được tạo từ lịch dạy (Schedule) hoặc thủ công.
Bấm tên HS để xem thống kê % chuyên cần.

## Scope
- Data model Session (buổi học, link với ScheduleItem)
- SessionSelector: chọn buổi + tạo buổi mới
- Bảng điểm danh: toggle Có/Vắng per HS, auto-save
- StudentAttendancePanel: thống kê % + lịch sử per HS
- Update cards tổng quan ở tab Học Viên (Phase A) với data thật

## Out of Scope
- Tạo Session tự động theo lịch (trigger backend) — chỉ tạo thủ công
- Notification vắng cho phụ huynh

## Dependencies
- Phase A: StudentEnrollment, getActiveStudents() phải có
- Schedule data (từ Phase 4 cũ) — nếu chưa có thì SessionSelector chỉ dùng thủ công

## Approach
- Session tạo thủ công qua SessionModal (ngày + giờ + chủ đề)
- Khi Session được tạo → tự động tạo HomeworkRecord stub cho Phase C
- AttendanceToggle auto-save (không cần nút Submit)
- Sau Phase B xong → update StudentDetailPanel (Phase A) hiện đúng "X/Y buổi"
